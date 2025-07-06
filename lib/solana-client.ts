import { Connection, PublicKey, Keypair, type Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import bs58 from "bs58"

export class SolanaClient {
  private connection: Connection
  private commitment = "confirmed" as const

  constructor() {
    // Use mainnet for production
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      this.commitment,
    )
  }

  async getConnection(): Promise<Connection> {
    return this.connection
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey)
      const balance = await this.connection.getBalance(pubKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error("Error getting balance:", error)
      return 0
    }
  }

  async getTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
    try {
      const walletPubKey = new PublicKey(walletAddress)
      const tokenMintPubKey = new PublicKey(tokenMint)

      const tokenAccount = await getAssociatedTokenAddress(tokenMintPubKey, walletPubKey)
      const balance = await this.connection.getTokenAccountBalance(tokenAccount)

      return balance.value.uiAmount || 0
    } catch (error) {
      console.error("Error getting token balance:", error)
      return 0
    }
  }

  async sendTransaction(transaction: Transaction, signers: Keypair[]): Promise<string> {
    try {
      const signature = await this.connection.sendTransaction(transaction, signers, {
        skipPreflight: false,
        preflightCommitment: this.commitment,
      })

      await this.connection.confirmTransaction(signature, this.commitment)
      return signature
    } catch (error) {
      console.error("Error sending transaction:", error)
      throw error
    }
  }

  keypairFromPrivateKey(privateKey: string): Keypair {
    try {
      // Try base58 format first
      const secretKey = bs58.decode(privateKey)
      return Keypair.fromSecretKey(secretKey)
    } catch {
      try {
        // Try JSON array format
        const parsed = JSON.parse(privateKey)
        if (Array.isArray(parsed)) {
          return Keypair.fromSecretKey(new Uint8Array(parsed))
        }
        throw new Error("Invalid format")
      } catch {
        throw new Error("Invalid private key format")
      }
    }
  }

  async getRecentBlockhash(): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash()
    return blockhash
  }
}
