"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Bot, Webhook, Info, Trash2 } from "lucide-react"

export default function BotSetup() {
  const [webhookStatus, setWebhookStatus] = useState<any>(null)
  const [botInfo, setBotInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const setupWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/setup-webhook", { method: "POST" })
      const result = await response.json()
      setWebhookStatus(result)
      console.log("Webhook setup result:", result)
    } catch (error) {
      setWebhookStatus({ success: false, error: "Network error" })
    }
    setLoading(false)
  }

  const checkWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/setup-webhook")
      const result = await response.json()
      setWebhookStatus(result)
      console.log("Webhook status result:", result)
    } catch (error) {
      console.error("Webhook check error:", error)
      setWebhookStatus({ success: false, error: "Network error" })
    }
    setLoading(false)
  }

  const deleteWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/setup-webhook", { method: "DELETE" })
      const result = await response.json()
      setWebhookStatus(result)
      console.log("Webhook delete result:", result)
    } catch (error) {
      setWebhookStatus({ success: false, error: "Network error" })
    }
    setLoading(false)
  }

  const getBotInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/bot-info")
      const result = await response.json()
      setBotInfo(result)
      console.log("Bot info result:", result)
    } catch (error) {
      setBotInfo({ success: false, error: "Network error" })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🚀 Trojan Auto Snipe Bot Setup</h1>
          <p className="text-gray-400">Configure your Telegram bot @TrojanAutoSnipeBot</p>
        </div>

        {/* Bot Token Info */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Bot className="h-5 w-5 text-blue-400 mr-2" />
              Bot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Bot Username</p>
                <p className="text-white font-mono">@TrojanAutoSnipeBot</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Bot Token</p>
                <p className="text-white font-mono">7519400767:AAE_CjfyhGgBXHNrt3SgwugZ74h4Q_J4A0k</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={getBotInfo} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  <Info className="h-4 w-4 mr-2" />
                  Get Bot Info
                </Button>
                <Button
                  onClick={async () => {
                    const chatId = prompt("Enter your chat ID (you can get it from @userinfobot):")
                    if (chatId) {
                      try {
                        const response = await fetch("/api/test-bot", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            chatId: Number.parseInt(chatId),
                            message: "🚀 Test message from Trojan Bot! If you see this, the bot is working correctly.",
                          }),
                        })
                        const result = await response.json()
                        alert(result.success ? "Test message sent!" : `Error: ${result.error}`)
                      } catch (error) {
                        alert(`Error: ${error.message}`)
                      }
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Send Test Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bot Info Display */}
        {botInfo && (
          <Card className="mb-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Bot Information</CardTitle>
            </CardHeader>
            <CardContent>
              {botInfo.ok ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white">Bot is active and responding</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-sm">Bot ID</p>
                      <p className="text-white">{botInfo.result.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Username</p>
                      <p className="text-white">@{botInfo.result.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">First Name</p>
                      <p className="text-white">{botInfo.result.first_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Can Join Groups</p>
                      <Badge variant={botInfo.result.can_join_groups ? "default" : "destructive"}>
                        {botInfo.result.can_join_groups ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-red-400">Error: {botInfo.error || "Failed to get bot info"}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Webhook Setup */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Webhook className="h-5 w-5 text-purple-400 mr-2" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>Set up webhook to receive Telegram updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button onClick={setupWebhook} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                  {loading ? "Setting up..." : "Setup Webhook"}
                </Button>
                <Button onClick={checkWebhook} disabled={loading} variant="outline" className="border-slate-600">
                  Check Webhook Status
                </Button>
                <Button onClick={deleteWebhook} disabled={loading} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Webhook
                </Button>
              </div>

              {webhookStatus && (
                <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                  {webhookStatus.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span className="text-green-400">
                          {webhookStatus.message || "Webhook operation successful!"}
                        </span>
                      </div>
                      {webhookStatus.webhook_url && (
                        <div>
                          <p className="text-gray-400 text-sm">Webhook URL</p>
                          <p className="text-white font-mono text-sm">{webhookStatus.webhook_url}</p>
                        </div>
                      )}
                      {webhookStatus.webhook_info && (
                        <div className="mt-4">
                          <p className="text-gray-400 text-sm">Webhook Status</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <span className="text-gray-400 text-xs">URL Set:</span>
                              <span className="text-white ml-2">
                                {webhookStatus.is_webhook_set ? "✅ Yes" : "❌ No"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-xs">Pending Updates:</span>
                              <span className="text-white ml-2">{webhookStatus.pending_updates || 0}</span>
                            </div>
                          </div>
                          {webhookStatus.last_error && (
                            <div className="mt-2">
                              <span className="text-gray-400 text-xs">Last Error:</span>
                              <p className="text-red-400 text-sm">{webhookStatus.last_error}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-red-400">Error: {webhookStatus.error}</span>
                      {webhookStatus.details && <p className="text-red-300 text-sm mt-1">{webhookStatus.details}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step by Step Fix */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">🔧 Fix Bot Not Responding</CardTitle>
            <CardDescription>Follow these steps in order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white">Delete Old Webhook</h3>
                  <p className="text-gray-300">Click "Delete Webhook" to clear any old configuration</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white">Setup New Webhook</h3>
                  <p className="text-gray-300">Click "Setup Webhook" to configure with current domain</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white">Check Status</h3>
                  <p className="text-gray-300">Click "Check Webhook Status" to verify it's working</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-white">Test Bot</h3>
                  <p className="text-gray-300">Send /start to your bot on Telegram</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Test */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">Ready to test your bot?</p>
          <Button
            onClick={() => window.open("https://t.me/TrojanAutoSnipeBot", "_blank")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Open @TrojanAutoSnipeBot
          </Button>
        </div>
      </div>
    </div>
  )
}
