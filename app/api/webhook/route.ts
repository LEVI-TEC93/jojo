import { type NextRequest, NextResponse } from "next/server"
import { TelegramBot } from "@/lib/telegram-bot"
import { handleBotCommand, handleImportSeed, handleImportPrivate } from "@/lib/bot-handlers"

const bot = new TelegramBot()

export async function POST(request: NextRequest) {
  try {
    console.log("=== WEBHOOK RECEIVED ===")
    const update = await request.json()
    console.log("Full update:", JSON.stringify(update, null, 2))

    if (update.message) {
      const chatId = update.message.chat.id
      const text = update.message.text
      const userId = update.message.from.id

      console.log(`=== PROCESSING MESSAGE ===`)
      console.log(`Chat ID: ${chatId}`)
      console.log(`User ID: ${userId}`)
      console.log(`Message: ${text}`)

      await handleBotCommand(chatId, text, userId, bot)
      console.log("Command handled successfully")
    }

    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id
      const data = update.callback_query.data
      const userId = update.callback_query.from.id

      console.log(`=== PROCESSING CALLBACK ===`)
      console.log(`Chat ID: ${chatId}`)
      console.log(`User ID: ${userId}`)
      console.log(`Callback Data: ${data}`)

      // Handle special callbacks
      if (data === "import_seed") {
        await handleImportSeed(chatId, userId, bot)
      } else if (data === "import_private") {
        await handleImportPrivate(chatId, userId, bot)
      } else {
        await handleBotCommand(chatId, data, userId, bot, true)
      }

      await bot.answerCallbackQuery(update.callback_query.id)
      console.log("Callback handled successfully")
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("=== WEBHOOK ERROR ===", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Webhook endpoint is working",
    timestamp: new Date().toISOString(),
    method: "GET",
  })
}
