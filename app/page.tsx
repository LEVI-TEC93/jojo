"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, Zap, Shield, TrendingUp, Users, Target } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="h-12 w-12 text-purple-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Trojan Auto Snipe Bot</h1>
          </div>
          <p className="text-xl text-gray-300 mb-6">@TrojanAutoSnipeBot - Your Ultimate Solana Trading Companion</p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            🚀 Now Live on Telegram
          </Badge>
        </div>

        {/* Warning */}
        <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>WARNING:</strong> DO NOT CLICK on any ADs at the top of Telegram. We have no control over ads
                shown by Telegram in this bot. Do not be scammed by fake airdrops or login pages.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Zap className="h-5 w-5 text-yellow-400 mr-2" />
                Lightning Fast Trading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Execute trades in milliseconds with our optimized Solana integration</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Target className="h-5 w-5 text-red-400 mr-2" />
                Auto Sniper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Automatically snipe new token launches with customizable filters</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Users className="h-5 w-5 text-blue-400 mr-2" />
                Copy Trading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Follow successful traders and copy their strategies automatically</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
                Portfolio Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Real-time P&L tracking with detailed analytics and insights</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Shield className="h-5 w-5 text-purple-400 mr-2" />
                MEV Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Advanced protection against MEV attacks and front-running</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Bot className="h-5 w-5 text-cyan-400 mr-2" />
                Multi-Wallet Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Manage multiple wallets with seamless switching and security</p>
            </CardContent>
          </Card>
        </div>

        {/* Bot Interface Preview */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Bot Interface</CardTitle>
            <CardDescription>All features accessible through simple Telegram commands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "💰 Buy",
                "💸 Sell",
                "📊 Positions",
                "📋 Limit Orders",
                "🔄 DCA Orders",
                "👥 Copy Trade",
                "🎯 Sniper",
                "⚔️ Trenches",
                "💎 Referrals",
                "⭐ Watchlist",
                "💳 Withdraw",
                "⚙️ Settings",
              ].map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  disabled
                >
                  {button}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Getting Started</CardTitle>
            <CardDescription>Start trading in minutes with these simple steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white">Start the Bot</h3>
                  <p className="text-gray-300">Send /start to @TrojanSolBot on Telegram</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white">Fund Your Wallet</h3>
                  <p className="text-gray-300">Deposit SOL to your generated wallet address</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white">Start Trading</h3>
                  <p className="text-gray-300">Use Buy/Sell buttons or enable Auto Sniper</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12">
          <Button
            onClick={() => window.open("https://t.me/TrojanAutoSnipeBot", "_blank")}
            className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3 mb-4"
          >
            🚀 Start Trading Now - @TrojanAutoSnipeBot
          </Button>
          <p className="text-gray-400">Join our community: @trojan | Follow us on Twitter</p>
          <p className="mt-2">⚠️ Always DYOR and trade responsibly</p>
        </div>
      </div>
    </div>
  )
}
