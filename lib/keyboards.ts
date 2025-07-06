export function getMainKeyboard(hasWallet = false) {
  const baseKeyboard = [
    [
      { text: "💰 Buy", callback_data: "buy" },
      { text: "💸 Sell", callback_data: "sell" },
    ],
    [
      { text: "📊 Positions", callback_data: "positions" },
      { text: "📋 Limit Orders", callback_data: "limit_orders" },
      { text: "🔄 DCA Orders", callback_data: "dca_orders" },
    ],
    [
      { text: "👥 Copy Trade", callback_data: "copy_trade" },
      { text: "🎯 Sniper NEW", callback_data: "sniper" },
    ],
    [
      { text: "⚔️ Trenches", callback_data: "trenches" },
      { text: "💎 Referrals", callback_data: "referrals" },
      { text: "⭐ Watchlist", callback_data: "watchlist" },
    ],
    [
      { text: "💳 Withdraw", callback_data: "withdraw" },
      { text: "⚙️ Settings", callback_data: "settings" },
    ],
  ]

  // Add wallet button at the top if no wallet is connected
  if (!hasWallet) {
    baseKeyboard.unshift([{ text: "🔐 Connect Wallet", callback_data: "wallet" }])
  } else {
    baseKeyboard.push([{ text: "🔐 Wallet", callback_data: "wallet" }])
  }

  baseKeyboard.push([
    { text: "❓ Help", callback_data: "help" },
    { text: "🔄 Refresh", callback_data: "refresh" },
  ])

  return { inline_keyboard: baseKeyboard }
}

export function getWalletKeyboard(hasWallet: boolean) {
  if (hasWallet) {
    return {
      inline_keyboard: [
        [
          { text: "👁️ Show Wallet Details", callback_data: "show_wallet" },
          { text: "💰 Check Balance", callback_data: "refresh" },
        ],
        [
          { text: "📥 Generate Deposit Address", callback_data: "generate_deposit" },
          { text: "🔗 Connect New Wallet", callback_data: "connect_wallet" },
        ],
        [{ text: "🆕 Generate New Wallet", callback_data: "generate_wallet" }],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }
  } else {
    return {
      inline_keyboard: [
        [{ text: "📥 Generate Deposit Address", callback_data: "generate_deposit" }],
        [
          { text: "🔗 Connect Existing Wallet", callback_data: "connect_wallet" },
          { text: "🆕 Generate New Wallet", callback_data: "generate_wallet" },
        ],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }
  }
}

export function getSniperKeyboard(isEnabled: boolean) {
  return {
    inline_keyboard: [
      [{ text: isEnabled ? "❌ Disable Sniper" : "✅ Enable Sniper", callback_data: "toggle_sniper" }],
      [
        { text: "⚙️ Sniper Settings", callback_data: "sniper_settings" },
        { text: "📊 Sniper Stats", callback_data: "sniper_stats" },
      ],
      [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
    ],
  }
}

export function getBuyKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🎯 Manual Buy", callback_data: "manual_buy" },
        { text: "⚡ Quick Buy", callback_data: "quick_buy" },
      ],
      [
        { text: "📊 Limit Buy", callback_data: "limit_buy" },
        { text: "🔄 DCA Buy", callback_data: "dca_buy" },
      ],
      [
        { text: "💰 0.1 SOL", callback_data: "buy_amount_0.1" },
        { text: "💰 0.5 SOL", callback_data: "buy_amount_0.5" },
        { text: "💰 1 SOL", callback_data: "buy_amount_1" },
      ],
      [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
    ],
  }
}

export function getSellKeyboard(positions: any[]) {
  const keyboard = []

  // Add position buttons
  positions.forEach((position, index) => {
    keyboard.push([
      { text: `💸 Sell ${position.symbol}`, callback_data: `sell_${position.id}` },
      { text: `📊 ${position.pnlPercent}%`, callback_data: `position_${position.id}` },
    ])
  })

  // Add percentage buttons
  keyboard.push([
    { text: "25%", callback_data: "sell_percent_25" },
    { text: "50%", callback_data: "sell_percent_50" },
    { text: "75%", callback_data: "sell_percent_75" },
    { text: "100%", callback_data: "sell_percent_100" },
  ])

  keyboard.push([{ text: "🔙 Back to Main", callback_data: "main_menu" }])

  return { inline_keyboard: keyboard }
}

export function getSettingsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 Slippage Settings", callback_data: "settings_slippage" },
        { text: "⛽ Gas Settings", callback_data: "settings_gas" },
      ],
      [
        { text: "🔐 Security Settings", callback_data: "settings_security" },
        { text: "🎯 Sniper Settings", callback_data: "sniper_settings" },
      ],
      [
        { text: "💰 Default Amounts", callback_data: "settings_amounts" },
        { text: "🔔 Notifications", callback_data: "settings_notifications" },
      ],
      [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
    ],
  }
}
