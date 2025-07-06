import { NextResponse, type NextRequest } from "next/server"
import { TelegramBot } from "@/lib/telegram-bot"

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json()

    if (!chatId || !message) {
      return NextResponse.json({ error: "Missing chatId or message" }, { status: 400 })
    }

    const bot = new TelegramBot()
    const result = await bot.sendMessage(chatId, message)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Test bot error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7519400767:AAE_CjfyhGgBXHNrt3SgwugZ74h4Q_J4A0k"

  try {
    // Test bot connection
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const result = await response.json()

    return NextResponse.json({
      botWorking: result.ok,
      botInfo: result.result,
      webhookEndpoint: "/api/webhook",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
