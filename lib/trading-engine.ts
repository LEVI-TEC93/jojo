import { Transaction, type Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SolanaClient } from "./solana-client"
import { FirebaseService } from "./firebase-service"

export interface Position {
  id: string
  symbol: string
  amount: number
  invested: number
  currentValue: number
  pnlPercent: string
  timeHeld: string
  tokenAddress: string
  entryPrice: number
  targetPrice: number
  stopLoss?: number
  userId: number
  signature: string
  timestamp: number
}

export interface TradeResult {
  success: boolean
  signature?: string
  error?: string
  amountReceived?: number
  price?: number
  slippage?: number
}

export class TradingEngine {
  private solanaClient: SolanaClient
  private firebase: FirebaseService
  private positions: Map<string, Position> = new Map()

  // Jupiter Swap API
  private readonly JUPITER_API = "https://quote-api.jup.ag/v6"

  constructor() {
    this.solanaClient = new SolanaClient()
    this.firebase = new FirebaseService()
  }

  async buyToken(userId: number, tokenAddress: string, amountSOL: number, slippage = 5): Promise<TradeResult> {
    try {
      console.log(`🔥 EXECUTING BUY: ${amountSOL} SOL for ${tokenAddress}`)

      // Get user wallet
      const walletData = await this.firebase.getWallet(userId)
      if (!walletData) {
        throw new Error("No wallet found for user")
      }

      const keypair = this.solanaClient.keypairFromPrivateKey(walletData.privateKey)

      // Check SOL balance
      const balance = await this.solanaClient.getBalance(keypair.publicKey.toString())
      if (balance < amountSOL + 0.01) {
        // Reserve 0.01 SOL for fees
        throw new Error("Insufficient SOL balance")
      }

      // Get quote from Jupiter
      const quote = await this.getJupiterQuote(
        "So11111111111111111111111111111111111111112", // WSOL
        tokenAddress,
        amountSOL * LAMPORTS_PER_SOL,
        slippage,
      )

      if (!quote) {
        throw new Error("Failed to get quote from Jupiter")
      }

      // Execute swap
      const swapResult = await this.executeJupiterSwap(keypair, quote)

      if (swapResult.success && swapResult.signature) {
        // Create position
        const position: Position = {
          id: Date.now().toString(),
          symbol: await this.getTokenSymbol(tokenAddress),
          amount: quote.outAmount / Math.pow(10, 9), // Assuming 9 decimals
          invested: amountSOL,
          currentValue: amountSOL,
          pnlPercent: "0.00",
          timeHeld: "0m",
          tokenAddress,
          entryPrice: amountSOL / (quote.outAmount / Math.pow(10, 9)),
          targetPrice: (amountSOL / (quote.outAmount / Math.pow(10, 9))) * 10, // 10x target
          userId,
          signature: swapResult.signature,
          timestamp: Date.now(),
        }

        this.positions.set(position.id, position)

        // Store in Firebase
        await this.firebase.storeTrade(userId, {
          type: "buy",
          tokenAddress,
          amount: amountSOL,
          price: position.entryPrice,
          signature: swapResult.signature,
          timestamp: new Date(),
        })

        console.log(`✅ BUY SUCCESSFUL: ${position.amount} tokens for ${amountSOL} SOL`)

        // Start monitoring for 10x profit
        this.monitorPosition(position)

        return {
          success: true,
          signature: swapResult.signature,
          amountReceived: position.amount,
          price: position.entryPrice,
          slippage: swapResult.slippage,
        }
      }

      throw new Error("Swap execution failed")
    } catch (error) {
      console.error("Error buying token:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async sellToken(userId: number, tokenAddress: string, percentage = 100, slippage = 5): Promise<TradeResult> {
    try {
      console.log(`💸 EXECUTING SELL: ${percentage}% of ${tokenAddress}`)

      // Get user wallet
      const walletData = await this.firebase.getWallet(userId)
      if (!walletData) {
        throw new Error("No wallet found for user")
      }

      const keypair = this.solanaClient.keypairFromPrivateKey(walletData.privateKey)

      // Get token balance
      const tokenBalance = await this.solanaClient.getTokenBalance(keypair.publicKey.toString(), tokenAddress)

      if (tokenBalance === 0) {
        throw new Error("No tokens to sell")
      }

      const amountToSell = (tokenBalance * percentage) / 100

      // Get quote from Jupiter
      const quote = await this.getJupiterQuote(
        tokenAddress,
        "So11111111111111111111111111111111111111112", // WSOL
        amountToSell * Math.pow(10, 9), // Assuming 9 decimals
        slippage,
      )

      if (!quote) {
        throw new Error("Failed to get quote from Jupiter")
      }

      // Execute swap
      const swapResult = await this.executeJupiterSwap(keypair, quote)

      if (swapResult.success && swapResult.signature) {
        const solReceived = quote.outAmount / LAMPORTS_PER_SOL

        // Update position
        const position = Array.from(this.positions.values()).find(
          (p) => p.tokenAddress === tokenAddress && p.userId === userId,
        )

        if (position) {
          if (percentage === 100) {
            this.positions.delete(position.id)
          } else {
            position.amount *= (100 - percentage) / 100
          }
        }

        // Store in Firebase
        await this.firebase.storeTrade(userId, {
          type: "sell",
          tokenAddress,
          amount: amountToSell,
          solReceived,
          price: solReceived / amountToSell,
          signature: swapResult.signature,
          timestamp: new Date(),
        })

        console.log(`✅ SELL SUCCESSFUL: ${amountToSell} tokens for ${solReceived} SOL`)

        return {
          success: true,
          signature: swapResult.signature,
          amountReceived: solReceived,
          price: solReceived / amountToSell,
          slippage: swapResult.slippage,
        }
      }

      throw new Error("Swap execution failed")
    } catch (error) {
      console.error("Error selling token:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  private async getJupiterQuote(inputMint: string, outputMint: string, amount: number, slippage: number): Promise<any> {
    try {
      const url = `${this.JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage * 100}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.statusText}`)
      }

      const quote = await response.json()
      return quote
    } catch (error) {
      console.error("Error getting Jupiter quote:", error)
      return null
    }
  }

  private async executeJupiterSwap(keypair: Keypair, quote: any): Promise<TradeResult> {
    try {
      // Get swap transaction from Jupiter
      const swapResponse = await fetch(`${this.JUPITER_API}/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: keypair.publicKey.toString(),
          wrapAndUnwrapSol: true,
        }),
      })

      if (!swapResponse.ok) {
        throw new Error(`Jupiter swap API error: ${swapResponse.statusText}`)
      }

      const { swapTransaction } = await swapResponse.json()

      // Deserialize and sign transaction
      const transactionBuf = Buffer.from(swapTransaction, "base64")
      const transaction = Transaction.from(transactionBuf)

      // Sign transaction
      transaction.sign(keypair)

      // Send transaction
      const signature = await this.solanaClient.sendTransaction(transaction, [])

      return {
        success: true,
        signature,
        slippage: quote.slippageBps / 100,
      }
    } catch (error) {
      console.error("Error executing Jupiter swap:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  private async monitorPosition(position: Position) {
    console.log(`👀 MONITORING POSITION: ${position.symbol} for 10x profit`)

    const checkPrice = async () => {
      try {
        const currentPrice = await this.getTokenPrice(position.tokenAddress)
        const currentValue = position.amount * currentPrice
        const pnlPercent = ((currentValue - position.invested) / position.invested) * 100

        // Update position
        position.currentValue = currentValue
        position.pnlPercent = pnlPercent.toFixed(2)
        position.timeHeld = this.formatTimeHeld(Date.now() - position.timestamp)

        console.log(`📊 ${position.symbol}: ${pnlPercent.toFixed(2)}% PnL`)

        // Check if we hit 10x (1000% profit)
        if (pnlPercent >= 1000) {
          console.log(`🚀 10X ACHIEVED! Selling ${position.symbol}`)

          // Auto-sell at 10x
          const sellResult = await this.sellToken(
            position.userId,
            position.tokenAddress,
            100, // Sell 100%
            10, // Higher slippage for quick execution
          )

          if (sellResult.success) {
            console.log(`✅ AUTO-SELL SUCCESSFUL: ${position.symbol} at 10x profit`)

            // Send notification to user
            await this.notifyUser(position.userId, {
              type: "10x_profit",
              symbol: position.symbol,
              profit: pnlPercent,
              solReceived: sellResult.amountReceived,
            })
          }

          return // Stop monitoring
        }

        // Continue monitoring if position still exists
        if (this.positions.has(position.id)) {
          setTimeout(checkPrice, 10000) // Check every 10 seconds
        }
      } catch (error) {
        console.error("Error monitoring position:", error)
        // Retry in 30 seconds
        setTimeout(checkPrice, 30000)
      }
    }

    // Start monitoring
    setTimeout(checkPrice, 10000)
  }

  private async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${tokenAddress}`)
      if (response.ok) {
        const data = await response.json()
        return data.data[tokenAddress]?.price || 0
      }
      return 0
    } catch (error) {
      console.error("Error getting token price:", error)
      return 0
    }
  }

  private async getTokenSymbol(tokenAddress: string): Promise<string> {
    try {
      const response = await fetch(`https://api.solana.fm/v1/tokens/${tokenAddress}`)
      if (response.ok) {
        const data = await response.json()
        return data.symbol || "UNK"
      }
      return "UNK"
    } catch (error) {
      console.error("Error getting token symbol:", error)
      return "UNK"
    }
  }

  private formatTimeHeld(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  private async notifyUser(userId: number, notification: any) {
    try {
      // Send notification via Telegram bot
      console.log(`📢 Notifying user ${userId}:`, notification)
      // Implementation would send message via Telegram bot
    } catch (error) {
      console.error("Error notifying user:", error)
    }
  }

  async getUserPositions(userId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter((p) => p.userId === userId)
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    return this.getTokenPrice(tokenAddress)
  }

  async createLimitOrder(
    userId: number,
    tokenAddress: string,
    type: "buy" | "sell",
    amount: number,
    targetPrice: number,
  ) {
    console.log(`[DEMO] Creating ${type} limit order for user ${userId}`)

    return {
      id: Date.now().toString(),
      success: true,
    }
  }

  async createDCAOrder(
    userId: number,
    tokenAddress: string,
    totalAmount: number,
    intervals: number,
    frequency: string,
  ) {
    console.log(`[DEMO] Creating DCA order for user ${userId}`)

    return {
      id: Date.now().toString(),
      success: true,
    }
  }
}
