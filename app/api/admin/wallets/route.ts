import { type NextRequest, NextResponse } from "next/server"
import { FirebaseService } from "@/lib/firebase-service"

const firebase = new FirebaseService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    let wallets = []

    if (userId) {
      // Get wallets for specific user
      wallets = await firebase.getAllUserWallets(Number.parseInt(userId))
    } else {
      // Get all wallets (you might want to add pagination here)
      wallets = await firebase.getAllWallets()
    }

    return NextResponse.json({
      success: true,
      wallets,
      count: wallets.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching wallets:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch wallets",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
