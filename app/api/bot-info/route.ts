import { NextResponse } from "next/server"

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7519400767:AAE_CjfyhGgBXHNrt3SgwugZ74h4Q_J4A0k"

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const result = await response.json()

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get bot info",
      },
      { status: 500 },
    )
  }
}
