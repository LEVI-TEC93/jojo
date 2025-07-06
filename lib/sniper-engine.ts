import { DexMonitor } from "./dex-monitor"
import { TradingEngine } from "./trading-engine"
import { UserDatabase } from "./user-database"
import { TelegramBot } from "./telegram-bot"

export interface SniperConfig {
  enabled: boolean
  minLiquidity: number
  maxMarketCap: number
  buyAmount: number
  requireRenounced: boolean
  requireVerified: boolean
  mevProtection: boolean
  gasPriority: "Normal" | "Fast" | "Turbo"
  maxSlippage: number
  autoSellAt10x: boolean
}

export interface SniperStats {
  totalSnipes: number
  successfulSnipes: number
  totalProfit: number
  averageEntry: number
  best10x: number
  activePositions: number
}

export class SniperEngine {
  private dexMonitor: DexMonitor
  private tradingEngine: TradingEngine
  private userDb: UserDatabase
  private bot: TelegramBot
  private activeSnipes: Map<number, SniperConfig> = new Map()
  private sniperStats: Map<number, SniperStats> = new Map()

  constructor() {
    this.dexMonitor = new DexMonitor()
    this.tradingEngine = new TradingEngine()
    this.userDb = new UserDatabase()
    this.bot = new TelegramBot()
  }

  async enableSniper(userId: number, config: SniperConfig) {
    try {
      console.log(`🎯 ENABLING SNIPER for user ${userId}`)

      // Validate user has sufficient balance
      const user = await this.userDb.getUser(userId)
      if (!user.wallet) {
        throw new Error("No wallet connected")
      }

      if ((user.solBalance || 0) < 0.8) {
        throw new Error("Insufficient SOL balance. Minimum 0.8 SOL required.")
      }

      // Store sniper config
      this.activeSnipes.set(userId, config)

      // Initialize stats if not exists
      if (!this.sniperStats.has(userId)) {
        this.sniperStats.set(userId, {
          totalSnipes: 0,
          successfulSnipes: 0,
          totalProfit: 0,
          averageEntry: 0,
          best10x: 0,
          activePositions: 0,
        })
      }

      // Add listener to DEX monitor
      this.dexMonitor.addListener(userId, (tokenEvent) => {
        this.handleNewToken(userId, tokenEvent, config)
      })

      // Start monitoring if not already started
      await this.dexMonitor.startMonitoring()

      console.log(`✅ SNIPER ENABLED for user ${userId}`)
      console.log(`💰 Buy Amount: ${config.buyAmount} SOL`)
      console.log(`💧 Min Liquidity: $${config.minLiquidity}`)
      console.log(`📊 Max Market Cap: $${config.maxMarketCap}`)

      return { success: true, message: "Sniper enabled successfully" }
    } catch (error) {
      console.error("Error enabling sniper:", error)
      throw error
    }
  }

  async disableSniper(userId: number) {
    try {
      console.log(`⏹️ DISABLING SNIPER for user ${userId}`)

      this.activeSnipes.delete(userId)
      this.dexMonitor.removeListener(userId)

      console.log(`✅ SNIPER DISABLED for user ${userId}`)
      return { success: true, message: "Sniper disabled successfully" }
    } catch (error) {
      console.error("Error disabling sniper:", error)
      throw error
    }
  }

  private async handleNewToken(userId: number, tokenEvent: any, config: SniperConfig) {
    try {
      console.log(`🚨 NEW TOKEN DETECTED for user ${userId}: ${tokenEvent.tokenAddress}`)

      // Apply filters
      if (!this.passesFilters(tokenEvent, config)) {
        console.log(`❌ Token ${tokenEvent.tokenAddress} failed filters`)
        return
      }

      console.log(`✅ Token ${tokenEvent.tokenAddress} passed all filters - SNIPING!`)

      // Update stats
      const stats = this.sniperStats.get(userId)!
      stats.totalSnipes++

      // Execute snipe
      const buyResult = await this.tradingEngine.buyToken(
        userId,
        tokenEvent.tokenAddress,
        config.buyAmount,
        config.maxSlippage,
      )

      if (buyResult.success) {
        stats.successfulSnipes++
        stats.activePositions++
        stats.averageEntry = (stats.averageEntry + buyResult.price!) / stats.successfulSnipes

        console.log(`🎯 SNIPE SUCCESSFUL: ${tokenEvent.tokenAddress}`)
        console.log(`💰 Bought ${buyResult.amountReceived} tokens for ${config.buyAmount} SOL`)
        console.log(`💲 Entry Price: $${buyResult.price}`)

        // Notify user
        await this.notifyUser(userId, {
          type: "snipe_success",
          tokenAddress: tokenEvent.tokenAddress,
          amount: buyResult.amountReceived,
          solSpent: config.buyAmount,
          price: buyResult.price,
          signature: buyResult.signature,
        })

        // The trading engine will automatically monitor for 10x and sell
      } else {
        console.log(`❌ SNIPE FAILED: ${tokenEvent.tokenAddress} - ${buyResult.error}`)

        // Notify user of failed snipe
        await this.notifyUser(userId, {
          type: "snipe_failed",
          tokenAddress: tokenEvent.tokenAddress,
          error: buyResult.error,
        })
      }

      this.sniperStats.set(userId, stats)
    } catch (error) {
      console.error("Error handling new token:", error)
    }
  }

  private passesFilters(tokenEvent: any, config: SniperConfig): boolean {
    // Check liquidity
    if (tokenEvent.liquidity < config.minLiquidity) {
      console.log(`❌ Liquidity too low: $${tokenEvent.liquidity} < $${config.minLiquidity}`)
      return false
    }

    // Check market cap
    if (tokenEvent.marketCap > config.maxMarketCap) {
      console.log(`❌ Market cap too high: $${tokenEvent.marketCap} > $${config.maxMarketCap}`)
      return false
    }

    // Additional filters would go here (renounced, verified, etc.)
    // For now, we'll pass all tokens that meet liquidity and market cap requirements

    console.log(`✅ Token passed all filters:`)
    console.log(`  💧 Liquidity: $${tokenEvent.liquidity}`)
    console.log(`  📊 Market Cap: $${tokenEvent.marketCap}`)
    console.log(`  🏪 DEX: ${tokenEvent.dex}`)

    return true
  }

  private async notifyUser(userId: number, notification: any) {
    try {
      let message = ""

      switch (notification.type) {
        case "snipe_success":
          message = `🎯 <b>SNIPE SUCCESSFUL!</b>

🪙 <b>Token:</b> <code>${notification.tokenAddress}</code>
💰 <b>Amount:</b> ${notification.amount.toFixed(2)} tokens
💸 <b>SOL Spent:</b> ${notification.solSpent} SOL
💲 <b>Entry Price:</b> $${notification.price.toFixed(8)}
🔗 <b>Signature:</b> <code>${notification.signature}</code>

🚀 <b>Monitoring for 10x profit...</b>
Bot will automatically sell when 1000% profit is reached!`
          break

        case "snipe_failed":
          message = `❌ <b>SNIPE FAILED</b>

🪙 <b>Token:</b> <code>${notification.tokenAddress}</code>
❌ <b>Error:</b> ${notification.error}

🔄 Sniper continues monitoring for new opportunities...`
          break

        case "10x_achieved":
          message = `🚀🚀 <b>10X PROFIT ACHIEVED!</b> 🚀🚀

🪙 <b>Token:</b> ${notification.symbol}
📈 <b>Profit:</b> ${notification.profit.toFixed(2)}%
💰 <b>SOL Received:</b> ${notification.solReceived.toFixed(4)} SOL

🎉 <b>Congratulations! Position automatically sold!</b>`
          break
      }

      if (message) {
        await this.bot.sendMessage(userId, message)
      }
    } catch (error) {
      console.error("Error notifying user:", error)
    }
  }

  async getSniperStats(userId: number): Promise<SniperStats> {
    return (
      this.sniperStats.get(userId) || {
        totalSnipes: 0,
        successfulSnipes: 0,
        totalProfit: 0,
        averageEntry: 0,
        best10x: 0,
        activePositions: 0,
      }
    )
  }

  isEnabled(userId: number): boolean {
    return this.activeSnipes.has(userId)
  }

  getConfig(userId: number): SniperConfig | null {
    return this.activeSnipes.get(userId) || null
  }

  async updateConfig(userId: number, updates: Partial<SniperConfig>) {
    const currentConfig = this.activeSnipes.get(userId)
    if (currentConfig) {
      const newConfig = { ...currentConfig, ...updates }
      this.activeSnipes.set(userId, newConfig)
      console.log(`⚙️ Updated sniper config for user ${userId}`)
      return newConfig
    }
    throw new Error("Sniper not enabled for this user")
  }
}
