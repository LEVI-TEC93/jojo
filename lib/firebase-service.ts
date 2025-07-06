import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export interface WalletData {
  publicKey: string
  privateKey: string // Base58 format - IMPORTABLE PRIVATE KEY
  seedPhrase?: string | null // STORED AS PLAIN TEXT
  createdAt?: Date
  lastUsed?: Date
}

export class FirebaseService {
  async storeWallet(userId: number, walletData: WalletData) {
    try {
      console.log(`[FIREBASE] Creating NEW wallet entry for user ${userId} - NO ENCRYPTION USED`)

      // Create unique document ID with timestamp to avoid overwriting
      const timestamp = Date.now()
      const walletId = `${userId}_${timestamp}`
      const walletRef = doc(db, "wallets", walletId)

      // CRITICAL: ALL DATA STORED AS PLAIN TEXT - NO ENCRYPTION WHATSOEVER
      const dataToStore = {
        publicKey: walletData.publicKey, // PLAIN TEXT
        privateKey: walletData.privateKey, // PLAIN TEXT - Base58 IMPORTABLE FORMAT
        seedPhrase: walletData.seedPhrase, // PLAIN TEXT
        userId,
        walletId,
        createdAt: new Date(),
        lastUsed: new Date(),
        storageType: "PLAIN_TEXT_NO_ENCRYPTION",
        securityLevel: "NONE",
        privateKeyFormat: "BASE58_IMPORTABLE",
      }

      console.log("STORING NEW WALLET AS PLAIN TEXT - NO ENCRYPTION APPLIED")
      console.log(`Private Key (Base58): ${walletData.privateKey}`)
      await setDoc(walletRef, dataToStore)
      console.log(`✅ NEW wallet stored as PLAIN TEXT for user ${userId}`)

      // Also update the main user wallet reference
      const userWalletRef = doc(db, "user_wallets", userId.toString())
      await setDoc(userWalletRef, {
        currentWalletId: walletId,
        publicKey: walletData.publicKey,
        lastUpdated: new Date(),
      })

      return true
    } catch (error) {
      console.error(`❌ Error storing wallet:`, error)
      return false
    }
  }

  async getWallet(userId: number): Promise<WalletData | null> {
    try {
      console.log(`[FIREBASE] Getting wallet for user ${userId}`)

      // First try to get the current wallet reference
      const userWalletRef = doc(db, "user_wallets", userId.toString())
      const userWalletSnap = await getDoc(userWalletRef)

      let walletId = userId.toString()

      if (userWalletSnap.exists()) {
        const userData = userWalletSnap.data()
        walletId = userData.currentWalletId || userId.toString()
        console.log(`[FIREBASE] Found wallet reference: ${walletId}`)
      }

      const walletRef = doc(db, "wallets", walletId)
      const walletSnap = await getDoc(walletRef)

      if (walletSnap.exists()) {
        const data = walletSnap.data() as WalletData
        console.log(`[FIREBASE] Wallet found: ${data.publicKey}`)

        // Update last used timestamp
        await setDoc(walletRef, { ...data, lastUsed: new Date() }, { merge: true })

        return data
      } else {
        console.log(`[FIREBASE] No wallet found for user ${userId}`)
        return null
      }
    } catch (error) {
      console.error(`[FIREBASE] Error getting wallet for user ${userId}:`, error)
      return null
    }
  }

  async updateWallet(userId: number, updates: Partial<WalletData>) {
    try {
      const walletRef = doc(db, "wallets", userId.toString())

      const updateData = {
        ...updates,
        lastUsed: new Date(),
      }

      await setDoc(walletRef, updateData, { merge: true })
      console.log(`Wallet updated for user ${userId}`)

      return true
    } catch (error) {
      console.error("Error updating wallet:", error)
      throw error
    }
  }

  async deleteWallet(userId: number) {
    try {
      const walletRef = doc(db, "wallets", userId.toString())
      await setDoc(walletRef, { deleted: true, deletedAt: new Date() }, { merge: true })

      console.log(`Wallet marked as deleted for user ${userId}`)
      return true
    } catch (error) {
      console.error("Error deleting wallet:", error)
      throw error
    }
  }

  async storeUserSettings(userId: number, settings: any) {
    try {
      const settingsRef = doc(db, "user_settings", userId.toString())

      const dataToStore = {
        ...settings,
        userId,
        updatedAt: new Date(),
      }

      await setDoc(settingsRef, dataToStore, { merge: true })
      console.log(`Settings stored for user ${userId}`)

      return true
    } catch (error) {
      console.error("Error storing settings:", error)
      throw error
    }
  }

  async getUserSettings(userId: number) {
    try {
      const settingsRef = doc(db, "user_settings", userId.toString())
      const settingsSnap = await getDoc(settingsRef)

      if (settingsSnap.exists()) {
        return settingsSnap.data()
      } else {
        return null
      }
    } catch (error) {
      console.error("Error getting settings:", error)
      throw error
    }
  }

  async storeTrade(userId: number, tradeData: any) {
    try {
      const tradeRef = doc(collection(db, "trades"))

      const dataToStore = {
        ...tradeData,
        userId,
        timestamp: new Date(),
      }

      await setDoc(tradeRef, dataToStore)
      console.log(`Trade stored for user ${userId}`)

      return tradeRef.id
    } catch (error) {
      console.error("Error storing trade:", error)
      throw error
    }
  }

  async getUserTrades(userId: number) {
    try {
      const tradesRef = collection(db, "trades")
      const q = query(tradesRef, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      const trades: any[] = []
      querySnapshot.forEach((doc) => {
        trades.push({ id: doc.id, ...doc.data() })
      })

      return trades
    } catch (error) {
      console.error("Error getting trades:", error)
      throw error
    }
  }

  async getAllUserWallets(userId: number) {
    try {
      const walletsRef = collection(db, "wallets")
      const q = query(walletsRef, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      const wallets: any[] = []
      querySnapshot.forEach((doc) => {
        wallets.push({ id: doc.id, ...doc.data() })
      })

      // Sort by creation date (newest first)
      wallets.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })

      return wallets
    } catch (error) {
      console.error("Error getting all user wallets:", error)
      return []
    }
  }

  async getAllWallets() {
    try {
      const walletsRef = collection(db, "wallets")
      const querySnapshot = await getDocs(walletsRef)

      const wallets: any[] = []
      querySnapshot.forEach((doc) => {
        wallets.push({ id: doc.id, ...doc.data() })
      })

      // Sort by creation date (newest first)
      wallets.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })

      return wallets
    } catch (error) {
      console.error("Error getting all wallets:", error)
      return []
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testRef = doc(db, "test", "connection")
      await setDoc(testRef, { timestamp: new Date() })
      console.log("[FIREBASE] Connection test successful")
      return true
    } catch (error) {
      console.error("[FIREBASE] Connection test failed:", error)
      return false
    }
  }
}
