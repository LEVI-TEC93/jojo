import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7519400767:AAE_CjfyhGgBXHNrt3SgwugZ74h4Q_J4A0k"

  try {
    // Get the current domain from the request
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const webhookUrl = `${baseUrl}/api/webhook`

    console.log(`Setting webhook to: ${webhookUrl}`)

    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true, // Clear any pending updates
      }),
    })

    const result = await response.json()
    console.log("Webhook setup result:", result)

    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: "Webhook set successfully",
        webhook_url: webhookUrl,
        bot_response: result,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.description,
          error_code: result.error_code,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Webhook setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set webhook",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7519400767:AAE_CjfyhGgBXHNrt3SgwugZ74h4Q_J4A0k"

  try {
    console.log("Getting webhook info...")
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const result = await response.json()

    console.log("Webhook info result:", result)

    if (result.ok) {
      return NextResponse.json({
        success: true,
        webhook_info: result.result,
        is_webhook_set: !!result.result.url,
        webhook_url: result.result.url,
        pending_updates: result.result.pending_update_count,
        last_error: result.result.last_error_message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.description,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Get webhook info error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get webhook info",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// DELETE method to remove webhook
export async function DELETE() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7519400767:AAE_CjfyhGgBXHNrt3SgwugZ74h4Q_J4A0k"

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drop_pending_updates: true,
      }),
    })

    const result = await response.json()

    return NextResponse.json({
      success: result.ok,
      message: result.ok ? "Webhook deleted successfully" : "Failed to delete webhook",
      details: result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete webhook",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
