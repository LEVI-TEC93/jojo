export class TelegramBot {
  private botToken: string
  private apiUrl: string

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "7519400767:AAE_CjfyhGgBXHNrt3SgwugZ74h4Q_J4A0k"
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  async sendMessage(chatId: number, text: string, options?: any) {
    try {
      console.log(`Sending message to ${chatId}: ${text.substring(0, 100)}...`)

      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          ...options,
        }),
      })

      const result = await response.json()

      if (!result.ok) {
        console.error("Telegram API error:", result)
        throw new Error(`Telegram API error: ${result.description}`)
      }

      console.log("Message sent successfully")
      return result
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  async editMessage(chatId: number, messageId: number, text: string, options?: any) {
    try {
      const response = await fetch(`${this.apiUrl}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: "HTML",
          ...options,
        }),
      })

      const result = await response.json()

      if (!result.ok) {
        console.error("Telegram API error:", result)
      }

      return result
    } catch (error) {
      console.error("Error editing message:", error)
      throw error
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string) {
    try {
      const response = await fetch(`${this.apiUrl}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
        }),
      })

      return response.json()
    } catch (error) {
      console.error("Error answering callback query:", error)
      throw error
    }
  }
}
