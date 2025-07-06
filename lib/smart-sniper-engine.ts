import { DexMonitor } from "./dex-monitor"
import { TradingEngine } from "./trading-engine"
import { UserDatabase } from "./user-database"
import { TelegramBot } from "./telegram-bot"
import { AITradingAssistant } from "./ai-trading-assistant"

export interface SmartSniperConfig {
  enabled: boolean
  buyAmount: number
  maxSlippage: number
  aiAnalysisEnabled: boolean
  minAIScore: number
  autoSellAt10x: boolean
  smartFiltering: boolean
  riskTolerance: "LOW" | "MEDIUM" | "HIGH" | "EXTREME"
  followAISignals: boolean
  adaptiveSettings: boolean
}

export interface SniperStats {
  totalSnipes: number
  successfulSnipes: number
  totalProfit: number
  averageEntry: number
  best10x: number
  activePositions: number
  aiAccuracy: number
  avgHoldTime: string
}

export class SmartSniperEngine {
  private dexMonitor: DexMonitor
  private tradingEngine: TradingEngine
  private userDb: UserDatabase
  private bot: TelegramBot
  private aiAssistant: AITradingAssistant
  private activeSnipes: Map<number, SmartSniperConfig> = new Map()
  private sniperStats: Map<number, SniperStats> = new Map()

  constructor() {
    this.dexMonitor = new DexMonitor()
    this.tradingEngine = new TradingEngine()
    this.userDb = new UserDatabase()
    this.bot = new TelegramBot()
    this.aiAssistant = new AITradingAssistant()
  }

  async enableSmartSniper(userId: number, config: SmartSniperConfig) {
    try {
      console.log(`🤖 ENABLING SMART AI SNIPER for user ${userId}`)

      // Validate user has wallet
      const userDb = new UserDatabase()
      const user = await userDb.getUser(userId)
      if (!user.wallet) {
        throw new Error("No wallet connected")
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
          aiAccuracy: 0,
          avgHoldTime: "0m",
        })
      }

      // Add listener to DEX monitor with AI filtering
      this.dexMonitor.addListener(userId, (tokenEvent) => {
        this.handleNewTokenWithAI(userId, tokenEvent, config)
      })

      // Start monitoring if not already started
      await this.dexMonitor.startMonitoring()

      // Get AI market sentiment
      const sentiment = await this.aiAssistant.getMarketSentiment()

      console.log(`✅ SMART SNIPER ENABLED for user ${userId}`)
      console.log(`🤖 AI Analysis: ${config.aiAnalysisEnabled ? "ENABLED" : "DISABLED"}`)
      console.log(`💰 Buy Amount: ${config.buyAmount} SOL`)
      console.log(`📊 Market Sentiment: ${sentiment.overall} (${sentiment.score})`)

      return {
        success: true,
        message: "Smart AI Sniper enabled successfully",
        marketSentiment: sentiment,
      }
    } catch (error) {
      console.error("Error enabling smart sniper:", error)
      throw error
    }
  }

  private async handleNewTokenWithAI(userId: number, tokenEvent: any, config: SmartSniperConfig) {
    try {
      console.log(`🤖 AI ANALYZING NEW TOKEN for user ${userId}: ${tokenEvent.tokenAddress}`)

      // Get AI analysis if enabled
      let aiAnalysis = null
      if (config.aiAnalysisEnabled) {
        aiAnalysis = await this.aiAssistant.analyzeToken(tokenEvent.tokenAddress, {
          name: tokenEvent.name,
          symbol: tokenEvent.symbol,
          liquidity: tokenEvent.liquidity,
          marketCap: tokenEvent.marketCap,
          verified: tokenEvent.verified,
          renounced: tokenEvent.renounced,
          age: "0 minutes",
          volume24h: 0,
          priceChange24h: 0,
          socialMentions: 0,
          devActivity: "Unknown",
        })

        console.log(`🤖 AI ANALYSIS RESULT:`)
        console.log(`   Score: ${aiAnalysis.score}/100`)
        console.log(`   Recommendation: ${aiAnalysis.recommendation}`)
        console.log(`   Confidence: ${aiAnalysis.confidence}%`)
        console.log(`   Risk: ${aiAnalysis.riskLevel}`)
        console.log(`   Predicted: ${aiAnalysis.predictedMultiplier}x`)

        // Check if AI score meets minimum threshold
        if (aiAnalysis.score < config.minAIScore) {
          console.log(`❌ AI Score too low: ${aiAnalysis.score} < ${config.minAIScore}`)
          return
        }

        // Check if AI recommends avoiding
        if (aiAnalysis.recommendation === "AVOID") {
          console.log(`❌ AI recommends AVOID`)
          return
        }
      }

      // Apply smart filtering
      if (config.smartFiltering && !this.passesSmartFilters(tokenEvent, config, aiAnalysis)) {
        console.log(`❌ Token failed smart filters`)
        return
      }

      console.log(`✅ Token passed all filters - EXECUTING SMART SNIPE!`)

      // Update stats
      const stats = this.sniperStats.get(userId)!
      stats.totalSnipes++

      // Adjust buy amount based on AI confidence and risk tolerance
      let adjustedBuyAmount = config.buyAmount
      if (aiAnalysis && config.adaptiveSettings) {
        adjustedBuyAmount = this.calculateOptimalBuyAmount(config, aiAnalysis)
      }

      // Execute snipe with dynamic slippage
      const dynamicSlippage = this.calculateDynamicSlippage(config, aiAnalysis)
      const buyResult = await this.tradingEngine.buyToken(
        userId,
        tokenEvent.tokenAddress,
        adjustedBuyAmount,
        dynamicSlippage,
      )

      if (buyResult.success) {
        stats.successfulSnipes++
        stats.activePositions++
        stats.averageEntry = (stats.averageEntry + buyResult.price!) / stats.successfulSnipes

        console.log(`🎯 SMART SNIPE SUCCESSFUL: ${tokenEvent.tokenAddress}`)
        console.log(`💰 Bought ${buyResult.amountReceived} tokens for ${adjustedBuyAmount} SOL`)
        console.log(`💲 Entry Price: $${buyResult.price}`)
        console.log(`🤖 AI Score: ${aiAnalysis?.score || "N/A"}`)

        // Notify user with AI insights
        await this.notifyUserWithAI(userId, {
          type: "smart_snipe_success",
          tokenAddress: tokenEvent.tokenAddress,
          amount: buyResult.amountReceived,
          solSpent: adjustedBuyAmount,
          price: buyResult.price,
          signature: buyResult.signature,
          aiAnalysis,
          adjustments: {
            originalAmount: config.buyAmount,
            adjustedAmount: adjustedBuyAmount,
            slippage: dynamicSlippage,
          },
        })

        // Start AI-powered monitoring
        this.startAIMonitoring(userId, tokenEvent.tokenAddress, aiAnalysis)
      } else {
        console.log(`❌ SMART SNIPE FAILED: ${tokenEvent.tokenAddress} - ${buyResult.error}`)

        await this.notifyUserWithAI(userId, {
          type: "snipe_failed",
          tokenAddress: tokenEvent.tokenAddress,
          error: buyResult.error,
          aiAnalysis,
        })
      }

      this.sniperStats.set(userId, stats)
    } catch (error) {
      console.error("Error handling new token with AI:", error)
    }
  }

  private passesSmartFilters(tokenEvent: any, config: SmartSniperConfig, aiAnalysis: any): boolean {
    // Basic liquidity check (more lenient)
    if (tokenEvent.liquidity < 100) {
      console.log(`❌ Liquidity too low: $${tokenEvent.liquidity}`)
      return false
    }

    // Risk tolerance check
    if (aiAnalysis) {
      const riskLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, EXTREME: 4 }
      const userRiskLevel = riskLevels[config.riskTolerance]
      const tokenRiskLevel = riskLevels[aiAnalysis.riskLevel]

      if (tokenRiskLevel > userRiskLevel) {
        console.log(`❌ Risk too high: ${aiAnalysis.riskLevel} > ${config.riskTolerance}`)
        return false
      }
    }

    // Smart market cap filtering based on AI prediction
    const maxMarketCap = aiAnalysis?.predictedMultiplier > 10 ? 200000 : 50000
    if (tokenEvent.marketCap > maxMarketCap) {
      console.log(`❌ Market cap too high: $${tokenEvent.marketCap} > $${maxMarketCap}`)
      return false
    }

    console.log(`✅ Token passed smart filters`)
    return true
  }

  private calculateOptimalBuyAmount(config: SmartSniperConfig, aiAnalysis: any): number {
    let multiplier = 1

    // Increase buy amount for high-confidence, high-potential tokens
    if (aiAnalysis.confidence > 80 && aiAnalysis.predictedMultiplier > 10) {
      multiplier = 1.5
    } else if (aiAnalysis.confidence > 60 && aiAnalysis.predictedMultiplier > 5) {
      multiplier = 1.2
    } else if (aiAnalysis.confidence < 40) {
      multiplier = 0.5
    }

    const adjustedAmount = config.buyAmount * multiplier
    console.log(`💡 Adjusted buy amount: ${config.buyAmount} → ${adjustedAmount} SOL (${multiplier}x)`)

    return Math.max(0.01, adjustedAmount) // Minimum 0.01 SOL
  }

  private calculateDynamicSlippage(config: SmartSniperConfig, aiAnalysis: any): number {
    let slippage = config.maxSlippage

    // Increase slippage for high-potential tokens to ensure execution
    if (aiAnalysis?.predictedMultiplier > 50) {
      slippage = Math.min(25, slippage * 1.5)
    } else if (aiAnalysis?.predictedMultiplier > 10) {
      slippage = Math.min(20, slippage * 1.2)
    }

    console.log(`💡 Dynamic slippage: ${config.maxSlippage}% → ${slippage}%`)
    return slippage
  }

  private async startAIMonitoring(userId: number, tokenAddress: string, aiAnalysis: any) {
    console.log(`🤖 Starting AI-powered monitoring for ${tokenAddress}`)

    const checkWithAI = async () => {
      try {
        const currentPrice = await this.tradingEngine.getTokenPrice(tokenAddress)
        const position = (await this.tradingEngine.getUserPositions(userId)).find(
          (p) => p.tokenAddress === tokenAddress,
        )

        if (!position) return // Position was sold

        // Get AI trading signal
        const signal = await this.aiAssistant.generateTradingSignal(tokenAddress, currentPrice, position)

        const pnlPercent = Number.parseFloat(position.pnlPercent)

        console.log(`🤖 AI Signal for ${position.symbol}: ${signal.action} (${signal.strength}%)`)
        console.log(`📊 Current PnL: ${pnlPercent}%`)

        // AI-powered sell decisions
        if (signal.action === "SELL" && signal.strength > 70) {
          console.log(`🤖 AI recommends SELL with high confidence`)
          await this.executeSellWithAI(userId, tokenAddress, signal)
          return
        }

        // Still check for 10x auto-sell
        if (pnlPercent >= 1000) {
          console.log(`🚀 10X ACHIEVED! Auto-selling ${position.symbol}`)
          await this.executeSellWithAI(userId, tokenAddress, signal)
          return
        }

        // Continue monitoring
        setTimeout(checkWithAI, 15000) // Check every 15 seconds
      } catch (error) {
        console.error("Error in AI monitoring:", error)
        setTimeout(checkWithAI, 30000) // Retry in 30 seconds
      }
    }

    // Start monitoring after 10 seconds
    setTimeout(checkWithAI, 10000)
  }

  private async executeSellWithAI(userId: number, tokenAddress: string, signal: any) {
    const sellResult = await this.tradingEngine.sellToken(
      userId,
      tokenAddress,
      100, // Sell 100%
      15, // Higher slippage for quick execution
    )

    if (sellResult.success) {
      const position = (await this.tradingEngine.getUserPositions(userId)).find((p) => p.tokenAddress === tokenAddress)

      await this.notifyUserWithAI(userId, {
        type: "ai_sell_success",
        tokenAddress,
        solReceived: sellResult.amountReceived,
        signal,
        position,
      })
    }
  }

  private async notifyUserWithAI(userId: number, notification: any) {
    try {
      let message = ""

      switch (notification.type) {
        case "smart_snipe_success":
          message = `🤖 <b>SMART SNIPE SUCCESSFUL!</b>

🪙 <b>Token:</b> <code>${notification.tokenAddress}</code>
💰 <b>Amount:</b> ${notification.amount.toFixed(2)} tokens
💸 <b>SOL Spent:</b> ${notification.solSpent} SOL
💲 <b>Entry Price:</b> $${notification.price.toFixed(8)}

🤖 <b>AI Analysis:</b>
• Score: ${notification.aiAnalysis?.score || "N/A"}/100
• Confidence: ${notification.aiAnalysis?.confidence || "N/A"}%
• Predicted: ${notification.aiAnalysis?.predictedMultiplier || "N/A"}x
• Risk: ${notification.aiAnalysis?.riskLevel || "N/A"}

⚙️ <b>Smart Adjustments:</b>
• Buy Amount: ${notification.adjustments.originalAmount} → ${notification.adjustments.adjustedAmount} SOL
• Slippage: ${notification.adjustments.slippage}%

🚀 <b>AI monitoring for optimal exit...</b>`
          break

        case "ai_sell_success":
          message = `🤖 <b>AI RECOMMENDED SELL EXECUTED!</b>

🪙 <b>Token:</b> ${notification.position?.symbol}
💰 <b>SOL Received:</b> ${notification.solReceived.toFixed(4)} SOL
📈 <b>Final PnL:</b> ${notification.position?.pnlPercent}%

🤖 <b>AI Signal:</b>
• Action: ${notification.signal.action}
• Strength: ${notification.signal.strength}%
• Reasoning: ${notification.signal.reasoning}

🎉 <b>Smart exit executed!</b>`
          break

        case "snipe_failed":
          message = `❌ <b>SNIPE FAILED</b>

🪙 <b>Token:</b> <code>${notification.tokenAddress}</code>
❌ <b>Error:</b> ${notification.error}

${
  notification.aiAnalysis
    ? `🤖 <b>AI Analysis:</b>
• Score: ${notification.aiAnalysis.score}/100
• Recommendation: ${notification.aiAnalysis.recommendation}`
    : ""
}

🔄 Smart sniper continues monitoring...`
          break
      }

      if (message) {
        await this.bot.sendMessage(userId, message)
      }
    } catch (error) {
      console.error("Error notifying user:", error)
    }
  }

  async disableSniper(userId: number) {
    try {
      console.log(`⏹️ DISABLING SMART SNIPER for user ${userId}`)
      this.activeSnipes.delete(userId)
      this.dexMonitor.removeListener(userId)
      return { success: true, message: "Smart sniper disabled successfully" }
    } catch (error) {
      console.error("Error disabling sniper:", error)
      throw error
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
        aiAccuracy: 0,
        avgHoldTime: "0m",
      }
    )
  }

  async optimizeSettings(userId: number): Promise<SmartSniperConfig> {
    const stats = await this.getSniperStats(userId)
    const marketConditions = {
      volatility: "HIGH",
      newTokenRate: 5,
      avgLiquidity: 2000,
      successTrend: "IMPROVING",
    }

    const recommendations = await this.aiAssistant.optimizeSniperSettings(stats, marketConditions)

    const currentConfig = this.activeSnipes.get(userId)
    if (currentConfig) {
      const optimizedConfig = {
        ...currentConfig,
        buyAmount: recommendations.buyAmount,
        maxSlippage: recommendations.slippage,
        minAIScore: Math.max(60, recommendations.minAIScore || 70),
      }

      this.activeSnipes.set(userId, optimizedConfig)
      return optimizedConfig
    }

    throw new Error("Sniper not enabled for this user")
  }

  isEnabled(userId: number): boolean {
    return this.activeSnipes.has(userId)
  }

  getConfig(userId: number): SmartSniperConfig | null {
    return this.activeSnipes.get(userId) || null
  }
}
