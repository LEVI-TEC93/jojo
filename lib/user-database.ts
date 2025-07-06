export interface User {
  id: number
  wallet?: string
  solBalance?: number
  activePositions?: number
  sniperEnabled?: boolean
  slippage?: number
  gasPriority?: string
  autoApprove?: boolean
  mevProtection?: boolean
  hasPassword?: boolean
  twoFactorEnabled?: boolean
  minLiquidity?: number
  maxMarketCap?: number
  defaultBuyAmount?: number
  defaultSellPercent?: number
  sniperAmount?: number
  requireRenounced?: boolean
  requireVerified?: boolean
  createdAt?: Date
  lastActive?: Date
}

export class UserDatabase {
  private users: Map<number, User> = new Map()

  async initUser(userId: number): Promise<User> {
    if (!this.users.has(userId)) {
      console.log(`[USER] Initializing new user: ${userId}`)

      const user: User = {
        id: userId,
        solBalance: 0,
        activePositions: 0,
        sniperEnabled: false,
        slippage: 15, // Better for memecoins
        gasPriority: "Fast",
        autoApprove: false,
        mevProtection: true,
        hasPassword: false,
        twoFactorEnabled: false,
        minLiquidity: 500, // Lower for more opportunities
        maxMarketCap: 100000,
        defaultBuyAmount: 0.1,
        defaultSellPercent: 100,
        sniperAmount: 0.1,
        requireRenounced: false, // More flexible
        requireVerified: false,
        createdAt: new Date(),
        lastActive: new Date(),
      }

      this.users.set(userId, user)
      console.log(`[USER] New user created: ${userId}`)
    } else {
      // Update last active
      const user = this.users.get(userId)!
      user.lastActive = new Date()
      this.users.set(userId, user)
    }

    return this.users.get(userId)!
  }

  async getUser(userId: number): Promise<User> {
    return this.users.get(userId) || (await this.initUser(userId))
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(userId)
    const updatedUser = { ...user, ...updates, lastActive: new Date() }
    this.users.set(userId, updatedUser)
    return updatedUser
  }

  async refreshUserData(userId: number): Promise<User> {
    const user = await this.getUser(userId)

    // Get live balance if wallet is connected
    if (user.wallet) {
      try {
        const walletManager = new (await import("./wallet-manager")).WalletManager()
        const liveBalance = await walletManager.getBalance(user.wallet)
        console.log(`[USER] Live balance for ${userId}: ${liveBalance} SOL`)

        const updates = {
          solBalance: liveBalance,
          lastActive: new Date(),
        }

        return this.updateUser(userId, updates)
      } catch (error) {
        console.error(`[USER] Error refreshing balance for ${userId}:`, error)
        return this.updateUser(userId, { lastActive: new Date() })
      }
    }

    return this.updateUser(userId, { lastActive: new Date() })
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
  }

  async deleteUser(userId: number): Promise<boolean> {
    return this.users.delete(userId)
  }
}
