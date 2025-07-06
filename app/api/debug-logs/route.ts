import { NextResponse } from "next/server"

// Simple in-memory log storage (in production, use a proper logging service)
let logs: string[] = []

export async function GET() {
  return NextResponse.json({
    logs: logs.slice(-50), // Return last 50 logs
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    const logEntry = `${new Date().toISOString()}: ${message}`
    logs.push(logEntry)

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs = logs.slice(-100)
    }

    console.log(logEntry)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
