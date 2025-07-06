import { NextResponse } from "next/server"
import { WalletManager } from "@/lib/wallet-manager"
import { FirebaseService } from "@/lib/firebase-service"
import { UserDatabase } from "@/lib/user-database"

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as any,
  }

  try {
    // Test Firebase connection
    console.log("Testing Firebase connection...")
    const firebase = new FirebaseService()
    const firebaseWorking = await firebase.testConnection()
    results.tests.firebase = {
      status: firebaseWorking ? "✅ Connected" : "❌ Failed",
      working: firebaseWorking,
    }

    // Test Solana RPC connection
    console.log("Testing Solana RPC connection...")
    const walletManager = new WalletManager()
    const testBalance = await walletManager.getBalance("11111111111111111111111111111112") // System program
    results.tests.solana = {
      status: testBalance >= 0 ? "✅ Connected" : "❌ Failed",
      working: testBalance >= 0,
      testBalance,
    }

    // Test User Database
    console.log("Testing User Database...")
    const userDb = new UserDatabase()
    const testUser = await userDb.initUser(999999) // Test user
    results.tests.userDatabase = {
      status: testUser ? "✅ Working" : "❌ Failed",
      working: !!testUser,
      testUserId: testUser?.id,
    }

    // Test wallet creation
    console.log("Testing wallet creation...")
    try {
      const testWallet = await walletManager.createWallet(999999)
      results.tests.walletCreation = {
        status: "✅ Working",
        working: true,
        testWalletCreated: !!testWallet.publicKey,
      }
    } catch (error) {
      results.tests.walletCreation = {
        status: "❌ Failed",
        working: false,
        error: error.message,
      }
    }

    // Overall status
    const allWorking = Object.values(results.tests).every((test: any) => test.working)
    results.overall = {
      status: allWorking ? "✅ All Systems Operational" : "⚠️ Some Issues Detected",
      allWorking,
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
        status: "❌ Test Failed",
      },
      { status: 500 },
    )
  }
}
