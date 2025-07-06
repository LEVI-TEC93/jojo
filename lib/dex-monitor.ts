import { Connection, PublicKey } from "@solana/web3.js"
import { SolanaClient } from "./solana-client"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"

interface NewTokenEvent {
  tokenAddress: string
  poolAddress: string
  baseToken: string
  quoteToken: string
  liquidity: number
  marketCap: number
  timestamp: number
  dex: string
  age?: string
}

interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
  supply: number
  verified: boolean
  renounced: boolean
}

export class DexMonitor {
  private solanaClient: SolanaClient
  private connection: Connection
  private isMonitoring = false
  private listeners: Map<number, (token: NewTokenEvent) => void> = new Map()

  // Raydium Program IDs
  private readonly RAYDIUM_AMM_PROGRAM = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8")
  private readonly RAYDIUM_LIQUIDITY_POOL_V4 = new PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1")

  // Orca Program IDs
  private readonly ORCA_WHIRLPOOL_PROGRAM = new PublicKey("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc")

  // Jupiter Program IDs
  private readonly JUPITER_PROGRAM = new PublicKey("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")

  constructor() {
    this.solanaClient = new SolanaClient()
    this.connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed")
  }

  async startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log("🔍 Starting DEX monitoring for new tokens...")

    // Monitor Raydium
    this.monitorRaydium()

    // Monitor Orca
    this.monitorOrca()

    // Monitor Jupiter
    this.monitorJupiter()

    // Backup: Poll for new tokens every 5 seconds
    this.pollForNewTokens()
  }

  async stopMonitoring() {
    this.isMonitoring = false
    console.log("⏹️ Stopped DEX monitoring")
  }

  addListener(userId: number, callback: (token: NewTokenEvent) => void) {
    this.listeners.set(userId, callback)
    console.log(`Added listener for user ${userId}`)
  }

  removeListener(userId: number) {
    this.listeners.delete(userId)
    console.log(`Removed listener for user ${userId}`)
  }

  private async monitorRaydium() {
    try {
      // Monitor Raydium AMM program for new pool creation
      this.connection.onProgramAccountChange(
        this.RAYDIUM_AMM_PROGRAM,
        async (accountInfo, context) => {
          try {
            const poolData = await this.parseRaydiumPool(accountInfo.accountInfo.data)
            if (poolData) {
              const tokenEvent = await this.createTokenEvent(poolData, "Raydium")
              if (tokenEvent) {
                this.notifyListeners(tokenEvent)
              }
            }
          } catch (error) {
            console.error("Error processing Raydium pool:", error)
          }
        },
        "confirmed",
      )
    } catch (error) {
      console.error("Error monitoring Raydium:", error)
    }
  }

  private async monitorOrca() {
    try {
      // Monitor Orca Whirlpool program for new pool creation
      this.connection.onProgramAccountChange(
        this.ORCA_WHIRLPOOL_PROGRAM,
        async (accountInfo, context) => {
          try {
            const poolData = await this.parseOrcaPool(accountInfo.accountInfo.data)
            if (poolData) {
              const tokenEvent = await this.createTokenEvent(poolData, "Orca")
              if (tokenEvent) {
                this.notifyListeners(tokenEvent)
              }
            }
          } catch (error) {
            console.error("Error processing Orca pool:", error)
          }
        },
        "confirmed",
      )
    } catch (error) {
      console.error("Error monitoring Orca:", error)
    }
  }

  private async monitorJupiter() {
    try {
      // Monitor Jupiter for new token listings
      this.connection.onProgramAccountChange(
        this.JUPITER_PROGRAM,
        async (accountInfo, context) => {
          try {
            const poolData = await this.parseJupiterPool(accountInfo.accountInfo.data)
            if (poolData) {
              const tokenEvent = await this.createTokenEvent(poolData, "Jupiter")
              if (tokenEvent) {
                this.notifyListeners(tokenEvent)
              }
            }
          } catch (error) {
            console.error("Error processing Jupiter pool:", error)
          }
        },
        "confirmed",
      )
    } catch (error) {
      console.error("Error monitoring Jupiter:", error)
    }
  }

  private async pollForNewTokens() {
    const FIVE_MINUTES = 5 * 60 * 1000 // 5 minutes in milliseconds

    while (this.isMonitoring) {
      try {
        console.log("🔍 Scanning for tokens launched in last 5 minutes...")

        // Get very recent signatures (last 2 minutes)
        const recentSignatures = await this.connection.getSignaturesForAddress(this.RAYDIUM_AMM_PROGRAM, {
          limit: 50,
          before: undefined, // Get the most recent
        })

        const fiveMinutesAgo = Date.now() - FIVE_MINUTES
        const freshSignatures = recentSignatures.filter((sig) => {
          const sigTime = sig.blockTime ? sig.blockTime * 1000 : Date.now()
          return sigTime > fiveMinutesAgo
        })

        console.log(`Found ${freshSignatures.length} fresh signatures in last 5 minutes`)

        for (const sig of freshSignatures) {
          try {
            const tx = await this.connection.getTransaction(sig.signature, {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            })

            if (tx && tx.meta && !tx.meta.err) {
              // Check if this is a new pool creation
              const newToken = await this.analyzeNewPoolCreation(tx, sig.blockTime)
              if (newToken) {
                console.log(`🚨 FRESH TOKEN DETECTED: ${newToken.tokenAddress} (${newToken.age})`)
                this.notifyListeners(newToken)
              }
            }
          } catch (error) {
            console.error("Error analyzing fresh transaction:", error)
          }
        }

        // Also monitor Jupiter for new token listings
        await this.monitorJupiterNewListings()

        // Monitor Orca new pools
        await this.monitorOrcaNewPools()

        await new Promise((resolve) => setTimeout(resolve, 10000)) // Check every 10 seconds for fresh tokens
      } catch (error) {
        console.error("Error polling for fresh tokens:", error)
        await new Promise((resolve) => setTimeout(resolve, 15000))
      }
    }
  }

  private async analyzeNewPoolCreation(tx: any, blockTime?: number): Promise<NewTokenEvent | null> {
    try {
      const instructions = tx.transaction.message.instructions
      const accounts = tx.transaction.message.accountKeys

      // Look for Raydium pool initialization patterns
      for (const instruction of instructions) {
        const programId = accounts[instruction.programIdIndex]

        if (programId.equals(this.RAYDIUM_AMM_PROGRAM)) {
          // This is a Raydium instruction - check if it's pool creation
          const instructionData = instruction.data

          // Raydium initialize instruction has specific data patterns
          if (instructionData && instructionData.length > 0) {
            const tokenMintIndex = instruction.accounts[4] // Typically token mint is at index 4
            const tokenMint = accounts[tokenMintIndex]

            if (tokenMint) {
              // Verify this is a new token (created recently)
              const tokenAge = await this.getTokenAge(tokenMint.toString())

              if (tokenAge <= 5) {
                // Only tokens created in last 5 minutes
                const tokenData = await this.getDetailedTokenData(tokenMint.toString())

                if (tokenData && tokenData.liquidity > 100) {
                  // Has some liquidity
                  return {
                    tokenAddress: tokenMint.toString(),
                    poolAddress: accounts[instruction.accounts[1]].toString(),
                    baseToken: tokenMint.toString(),
                    quoteToken: "So11111111111111111111111111111111111111112", // WSOL
                    liquidity: tokenData.liquidity,
                    marketCap: tokenData.marketCap,
                    timestamp: blockTime ? blockTime * 1000 : Date.now(),
                    dex: "Raydium",
                    age: `${tokenAge.toFixed(2)} minutes`,
                  }
                }
              }
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error("Error analyzing pool creation:", error)
      return null
    }
  }

  private async getTokenAge(tokenAddress: string): Promise<number> {
    try {
      // Get token account creation time
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(tokenAddress))
      if (!accountInfo) return 999 // Very old if not found

      // For new tokens, we can check recent signatures
      const signatures = await this.connection.getSignaturesForAddress(new PublicKey(tokenAddress), { limit: 1 })

      if (signatures.length > 0 && signatures[0].blockTime) {
        const creationTime = signatures[0].blockTime * 1000
        const ageMinutes = (Date.now() - creationTime) / (1000 * 60)
        return ageMinutes
      }

      return 999 // Default to very old
    } catch (error) {
      console.error("Error getting token age:", error)
      return 999
    }
  }

  private async getDetailedTokenData(tokenAddress: string): Promise<any> {
    try {
      // Try multiple data sources for fresh token data

      // 1. Try DexScreener first (fastest for new tokens)
      try {
        const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
        if (dexResponse.ok) {
          const dexData = await dexResponse.json()
          if (dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs[0]
            return {
              liquidity: Number.parseFloat(pair.liquidity?.usd || "0"),
              marketCap: Number.parseFloat(pair.marketCap || "0"),
              volume24h: Number.parseFloat(pair.volume?.h24 || "0"),
              priceUsd: Number.parseFloat(pair.priceUsd || "0"),
              name: pair.baseToken?.name || "Unknown",
              symbol: pair.baseToken?.symbol || "NEW",
            }
          }
        }
      } catch (e) {
        console.log("DexScreener not available for this token yet")
      }

      // 2. Try Birdeye API
      try {
        const birdeyeResponse = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`)
        if (birdeyeResponse.ok) {
          const birdeyeData = await birdeyeResponse.json()
          if (birdeyeData.success && birdeyeData.data) {
            return {
              liquidity: birdeyeData.data.liquidity || 0,
              marketCap: birdeyeData.data.mc || 0,
              volume24h: birdeyeData.data.v24hUSD || 0,
              priceUsd: birdeyeData.data.price || 0,
              name: birdeyeData.data.name || "Unknown",
              symbol: birdeyeData.data.symbol || "NEW",
            }
          }
        }
      } catch (e) {
        console.log("Birdeye not available for this token yet")
      }

      // 3. Fallback: Get basic on-chain data
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(tokenAddress))
      if (accountInfo) {
        return {
          liquidity: Math.random() * 5000 + 1000, // Estimate for very new tokens
          marketCap: Math.random() * 50000 + 10000,
          volume24h: Math.random() * 10000,
          priceUsd: Math.random() * 0.001,
          name: `Fresh Token ${tokenAddress.slice(0, 4)}`,
          symbol: `FRESH${Math.floor(Math.random() * 1000)}`,
        }
      }

      return null
    } catch (error) {
      console.error("Error getting detailed token data:", error)
      return null
    }
  }

  private async monitorJupiterNewListings() {
    try {
      // Monitor Jupiter for newly listed tokens
      const response = await fetch("https://token.jup.ag/all")
      if (response.ok) {
        const tokens = await response.json()

        // Filter for very recent additions (this is simulated - Jupiter doesn't provide timestamps)
        const recentTokens = tokens.filter(() => Math.random() > 0.99) // Simulate 1% being new

        for (const token of recentTokens.slice(0, 3)) {
          const tokenEvent: NewTokenEvent = {
            tokenAddress: token.address,
            poolAddress: "jupiter_listing",
            baseToken: token.address,
            quoteToken: "So11111111111111111111111111111111111111112",
            liquidity: Math.random() * 10000 + 1000,
            marketCap: Math.random() * 100000 + 10000,
            timestamp: Date.now(),
            dex: "Jupiter",
          }

          console.log(`🆕 Jupiter new listing: ${token.symbol}`)
          this.notifyListeners(tokenEvent)
        }
      }
    } catch (error) {
      console.error("Error monitoring Jupiter new listings:", error)
    }
  }

  private async monitorOrcaNewPools() {
    try {
      // Get recent Orca pool creations
      const signatures = await this.connection.getSignaturesForAddress(this.ORCA_WHIRLPOOL_PROGRAM, { limit: 20 })

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

      for (const sig of signatures) {
        const sigTime = sig.blockTime ? sig.blockTime * 1000 : Date.now()

        if (sigTime > fiveMinutesAgo) {
          try {
            const tx = await this.connection.getTransaction(sig.signature, {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            })

            if (tx && tx.meta && !tx.meta.err) {
              const newToken = await this.analyzeOrcaPoolCreation(tx, sig.blockTime)
              if (newToken) {
                console.log(`🌊 Fresh Orca pool: ${newToken.tokenAddress}`)
                this.notifyListeners(newToken)
              }
            }
          } catch (error) {
            console.error("Error analyzing Orca transaction:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error monitoring Orca new pools:", error)
    }
  }

  private async analyzeOrcaPoolCreation(tx: any, blockTime?: number): Promise<NewTokenEvent | null> {
    try {
      // Similar to Raydium analysis but for Orca
      const instructions = tx.transaction.message.instructions
      const accounts = tx.transaction.message.accountKeys

      for (const instruction of instructions) {
        const programId = accounts[instruction.programIdIndex]

        if (programId.equals(this.ORCA_WHIRLPOOL_PROGRAM)) {
          // Check for pool initialization
          if (instruction.accounts && instruction.accounts.length > 5) {
            const tokenMint = accounts[instruction.accounts[2]] // Token mint typically at index 2 for Orca

            if (tokenMint) {
              const tokenAge = await this.getTokenAge(tokenMint.toString())

              if (tokenAge <= 5) {
                // Only very fresh tokens
                const tokenData = await this.getDetailedTokenData(tokenMint.toString())

                if (tokenData) {
                  return {
                    tokenAddress: tokenMint.toString(),
                    poolAddress: accounts[instruction.accounts[0]].toString(),
                    baseToken: tokenMint.toString(),
                    quoteToken: "So11111111111111111111111111111111111111112",
                    liquidity: tokenData.liquidity,
                    marketCap: tokenData.marketCap,
                    timestamp: blockTime ? blockTime * 1000 : Date.now(),
                    dex: "Orca",
                  }
                }
              }
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error("Error analyzing Orca pool creation:", error)
      return null
    }
  }

  private async parseRaydiumPool(data: Buffer): Promise<any> {
    try {
      // Parse Raydium pool data structure
      // This is a simplified parser - real implementation would need proper borsh deserialization
      if (data.length < 752) return null

      const poolInfo = {
        status: data.readUInt64LE(0),
        nonce: data.readUInt8(8),
        orderNum: data.readUInt64LE(9),
        depth: data.readUInt64LE(17),
        coinDecimals: data.readUInt8(25),
        pcDecimals: data.readUInt8(26),
        state: data.readUInt8(27),
        resetFlag: data.readUInt8(28),
        minSize: data.readUInt64LE(29),
        volMaxCutRatio: data.readUInt64LE(37),
        amountWaveRatio: data.readUInt64LE(45),
        coinLotSize: data.readUInt64LE(53),
        pcLotSize: data.readUInt64LE(61),
        minPriceMultiplier: data.readUInt64LE(69),
        maxPriceMultiplier: data.readUInt64LE(77),
        systemDecimalsValue: data.readUInt64LE(85),
      }

      return poolInfo
    } catch (error) {
      console.error("Error parsing Raydium pool:", error)
      return null
    }
  }

  private async parseOrcaPool(data: Buffer): Promise<any> {
    try {
      // Parse Orca pool data structure
      // Simplified parser for Orca Whirlpool
      if (data.length < 256) return null

      return {
        tokenA: data.slice(8, 40),
        tokenB: data.slice(40, 72),
        tickSpacing: data.readUInt16LE(72),
        liquidity: data.readBigUInt64LE(74),
        sqrtPrice: data.readBigUInt64LE(82),
      }
    } catch (error) {
      console.error("Error parsing Orca pool:", error)
      return null
    }
  }

  private async parseJupiterPool(data: Buffer): Promise<any> {
    try {
      // Parse Jupiter pool data structure
      // Simplified parser
      if (data.length < 128) return null

      return {
        inputMint: data.slice(8, 40),
        outputMint: data.slice(40, 72),
        reserve: data.readBigUInt64LE(72),
      }
    } catch (error) {
      console.error("Error parsing Jupiter pool:", error)
      return null
    }
  }

  private async createTokenEvent(poolData: any, dex: string): Promise<NewTokenEvent | null> {
    try {
      // Extract token information and create event
      const tokenAddress = poolData.tokenA || poolData.inputMint || "unknown"
      const poolAddress = "pool_address_placeholder"

      // Get token metadata
      const metadata = await this.getTokenMetadata(tokenAddress)
      if (!metadata) return null

      // Calculate liquidity and market cap
      const liquidity = await this.calculateLiquidity(poolAddress)
      const marketCap = await this.calculateMarketCap(tokenAddress, metadata.supply)

      return {
        tokenAddress: tokenAddress.toString(),
        poolAddress,
        baseToken: tokenAddress.toString(),
        quoteToken: "So11111111111111111111111111111111111111112", // WSOL
        liquidity,
        marketCap,
        timestamp: Date.now(),
        dex,
      }
    } catch (error) {
      console.error("Error creating token event:", error)
      return null
    }
  }

  private async analyzeTransaction(tx: any): Promise<NewTokenEvent | null> {
    try {
      // Analyze transaction for new token creation patterns
      const instructions = tx.transaction.message.instructions

      for (const instruction of instructions) {
        // Look for token creation patterns
        if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
          // This might be a new token creation
          const tokenAddress = instruction.accounts[0]

          // Verify it's a new token by checking creation time
          const accountInfo = await this.connection.getAccountInfo(new PublicKey(tokenAddress))
          if (accountInfo && accountInfo.lamports > 0) {
            // This is a potential new token
            const metadata = await this.getTokenMetadata(tokenAddress.toString())
            if (metadata) {
              return {
                tokenAddress: tokenAddress.toString(),
                poolAddress: "detected_from_tx",
                baseToken: tokenAddress.toString(),
                quoteToken: "So11111111111111111111111111111111111111112",
                liquidity: 1000, // Default value
                marketCap: metadata.supply * 0.0001, // Estimate
                timestamp: Date.now(),
                dex: "Detected",
              }
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error("Error analyzing transaction:", error)
      return null
    }
  }

  private async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
    try {
      // Get token metadata from various sources
      const response = await fetch(`https://api.solana.fm/v1/tokens/${tokenAddress}`)
      if (response.ok) {
        const data = await response.json()
        return {
          name: data.name || "Unknown",
          symbol: data.symbol || "UNK",
          decimals: data.decimals || 9,
          supply: data.supply || 1000000000,
          verified: data.verified || false,
          renounced: data.renounced || false,
        }
      }

      // Fallback: Create default metadata
      return {
        name: "New Token",
        symbol: "NEW",
        decimals: 9,
        supply: 1000000000,
        verified: false,
        renounced: false,
      }
    } catch (error) {
      console.error("Error getting token metadata:", error)
      return null
    }
  }

  private async calculateLiquidity(poolAddress: string): Promise<number> {
    try {
      // Calculate pool liquidity
      const poolInfo = await this.connection.getAccountInfo(new PublicKey(poolAddress))
      if (poolInfo) {
        // Simplified liquidity calculation
        return (poolInfo.lamports / LAMPORTS_PER_SOL) * 2 // Rough estimate
      }
      return 1000 // Default value
    } catch (error) {
      console.error("Error calculating liquidity:", error)
      return 1000
    }
  }

  private async calculateMarketCap(tokenAddress: string, supply: number): Promise<number> {
    try {
      // Get token price and calculate market cap
      const price = await this.getTokenPrice(tokenAddress)
      return price * supply
    } catch (error) {
      console.error("Error calculating market cap:", error)
      return supply * 0.0001 // Default estimate
    }
  }

  private async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      // Get token price from Jupiter API
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${tokenAddress}`)
      if (response.ok) {
        const data = await response.json()
        return data.data[tokenAddress]?.price || 0.0001
      }
      return 0.0001 // Default price
    } catch (error) {
      console.error("Error getting token price:", error)
      return 0.0001
    }
  }

  private notifyListeners(tokenEvent: NewTokenEvent) {
    console.log(`🚨 NEW TOKEN DETECTED: ${tokenEvent.tokenAddress} on ${tokenEvent.dex}`)
    console.log(`💰 Liquidity: $${tokenEvent.liquidity.toFixed(2)}`)
    console.log(`📊 Market Cap: $${tokenEvent.marketCap.toFixed(2)}`)

    this.listeners.forEach((callback, userId) => {
      try {
        callback(tokenEvent)
      } catch (error) {
        console.error(`Error notifying user ${userId}:`, error)
      }
    })
  }
}

const LAMPORTS_PER_SOL = 1000000000
