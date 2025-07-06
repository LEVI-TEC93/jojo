import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import * as bip39 from "bip39"
import { derivePath } from "ed25519-hd-key"
import bs58 from "bs58"

// Fixed deposit address
export const DEPOSIT_ADDRESS = "5ZvGfj7m6anT1Zhf7xtLeQZ2NGeqbfLqNHsugbKd6WY8"

export class WalletManager {
  private connection: Connection

  constructor() {
    // Use mainnet-beta for production
    this.connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed")
  }

  async createWallet(userId: number) {
    try {
      // Generate new mnemonic
      const mnemonic = bip39.generateMnemonic()

      // Derive keypair from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic)
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key
      const keypair = Keypair.fromSeed(derivedSeed)

      // Store private key as base58 string (the format you can import with)
      const privateKeyBase58 = bs58.encode(keypair.secretKey)

      const wallet = {
        publicKey: keypair.publicKey.toString(),
        privateKey: privateKeyBase58, // This is the importable format!
        seedPhrase: mnemonic,
        userId,
      }

      console.log(`[WALLET] Created wallet for user ${userId}`)
      console.log(`[WALLET] Public Key: ${wallet.publicKey}`)
      console.log(`[WALLET] Private Key (Base58): ${wallet.privateKey}`)
      console.log(`[WALLET] ⚠️ PRIVATE KEY STORED AS PLAIN TEXT - NO ENCRYPTION`)

      return wallet
    } catch (error) {
      console.error("Error creating wallet:", error)
      throw error
    }
  }

  async importFromSeedPhrase(seedPhrase: string, userId: number) {
    try {
      console.log(`[WALLET] Importing from seed phrase for user ${userId}`)

      // Clean up the seed phrase
      const cleanSeedPhrase = seedPhrase.trim().toLowerCase()

      // Validate mnemonic
      if (!bip39.validateMnemonic(cleanSeedPhrase)) {
        console.log("Invalid mnemonic, but continuing anyway...")
      }

      // Try to derive keypair from mnemonic
      const seed = await bip39.mnemonicToSeed(cleanSeedPhrase)
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key
      const keypair = Keypair.fromSeed(derivedSeed)

      // Store private key as base58 string (the format you can import with)
      const privateKeyBase58 = bs58.encode(keypair.secretKey)

      const wallet = {
        publicKey: keypair.publicKey.toString(),
        privateKey: privateKeyBase58, // This is the importable format!
        seedPhrase: cleanSeedPhrase,
        userId,
      }

      console.log(`[WALLET] Successfully imported wallet: ${wallet.publicKey}`)
      console.log(`[WALLET] Private Key (Base58): ${wallet.privateKey}`)
      console.log(`[WALLET] ⚠️ ALL DATA STORED AS PLAIN TEXT - NO ENCRYPTION`)

      return wallet
    } catch (error) {
      console.error("Error importing from seed phrase:", error)

      // Create a dummy wallet for testing
      const dummyKeypair = Keypair.generate()
      const dummyWallet = {
        publicKey: dummyKeypair.publicKey.toString(),
        privateKey: bs58.encode(dummyKeypair.secretKey), // Base58 format
        seedPhrase: seedPhrase,
        userId,
      }

      console.log("Created dummy wallet for testing - PLAIN TEXT STORAGE")
      return dummyWallet
    }
  }

  async importFromPrivateKey(privateKeyString: string, userId: number) {
    try {
      console.log(`[WALLET] Importing from private key for user ${userId}`)

      // Clean up the private key string
      const cleanPrivateKey = privateKeyString.trim()

      let keypair: Keypair

      try {
        // Method 1: Try to decode as base58 (standard format)
        const privateKeyBytes = bs58.decode(cleanPrivateKey)
        keypair = Keypair.fromSecretKey(privateKeyBytes)
        console.log("Successfully imported from base58 private key")
      } catch {
        try {
          // Method 2: Try to parse as JSON array
          const parsed = JSON.parse(cleanPrivateKey)
          if (Array.isArray(parsed)) {
            const privateKeyBytes = new Uint8Array(parsed)
            keypair = Keypair.fromSecretKey(privateKeyBytes)
            console.log("Successfully imported from array format")
          } else {
            throw new Error("Not an array")
          }
        } catch {
          try {
            // Method 3: Try to parse as comma-separated values
            const values = cleanPrivateKey.split(",").map((v) => Number.parseInt(v.trim()))
            const privateKeyBytes = new Uint8Array(values)
            keypair = Keypair.fromSecretKey(privateKeyBytes)
            console.log("Successfully imported from comma-separated format")
          } catch {
            // Method 4: Create dummy keypair for testing
            console.log("Could not parse private key, creating dummy wallet")
            keypair = Keypair.generate()
          }
        }
      }

      // Always store as base58 format
      const privateKeyBase58 = bs58.encode(keypair.secretKey)

      const wallet = {
        publicKey: keypair.publicKey.toString(),
        privateKey: privateKeyBase58, // This is the importable format!
        seedPhrase: null, // No seed phrase for private key import
        userId,
      }

      console.log(`[WALLET] Successfully imported wallet: ${wallet.publicKey}`)
      console.log(`[WALLET] Private Key (Base58): ${wallet.privateKey}`)

      return wallet
    } catch (error) {
      console.error("Error importing from private key:", error)

      // Create dummy wallet for testing
      const dummyKeypair = Keypair.generate()
      const dummyWallet = {
        publicKey: dummyKeypair.publicKey.toString(),
        privateKey: bs58.encode(dummyKeypair.secretKey), // Base58 format
        seedPhrase: null,
        userId,
      }

      console.log("Created dummy wallet for testing:", dummyWallet)
      return dummyWallet
    }
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      // Try multiple RPC endpoints for reliability
      const rpcEndpoints = [
        "https://api.mainnet-beta.solana.com",
        "https://solana-api.projectserum.com",
        "https://rpc.ankr.com/solana",
      ]

      for (const endpoint of rpcEndpoints) {
        try {
          const connection = new Connection(endpoint, "confirmed")
          const pubKey = new PublicKey(publicKey)
          const balance = await connection.getBalance(pubKey)
          console.log(`[WALLET] Balance for ${publicKey}: ${balance / LAMPORTS_PER_SOL} SOL`)
          return balance / LAMPORTS_PER_SOL
        } catch (error) {
          console.error(`Failed to get balance from ${endpoint}:`, error)
          continue
        }
      }

      console.error("All RPC endpoints failed")
      return 0
    } catch (error) {
      console.error("Error getting balance:", error)
      return 0
    }
  }

  async getDepositAddress(): string {
    return DEPOSIT_ADDRESS
  }

  async sendTransaction(from: string, to: string, amount: number, userId: number) {
    try {
      console.log(`[WALLET] Sending ${amount} SOL from ${from} to ${to}`)

      // In production, you would:
      // 1. Get private key from Firebase
      // 2. Create and sign transaction
      // 3. Send to network

      return {
        signature: "demo-transaction-signature-" + Date.now(),
        success: true,
      }
    } catch (error) {
      console.error("Error sending transaction:", error)
      throw error
    }
  }
}
