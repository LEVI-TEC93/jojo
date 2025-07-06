"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Activity, DollarSign, TrendingUp, Bot, AlertTriangle } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 190653,
    activeUsers: 12847,
    totalVolume: 2847392,
    totalTrades: 584729,
    activeBots: 8934,
    successRate: 73.2,
  })

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, user: "User#12847", action: "Buy BONK", amount: "0.5 SOL", time: "2 min ago", status: "success" },
    { id: 2, user: "User#98234", action: "Sniper activated", amount: "1.0 SOL", time: "3 min ago", status: "active" },
    { id: 3, user: "User#45612", action: "Sell WIF", amount: "2.3 SOL", time: "5 min ago", status: "success" },
    { id: 4, user: "User#78901", action: "Copy trade", amount: "0.8 SOL", time: "7 min ago", status: "pending" },
    { id: 5, user: "User#23456", action: "DCA order", amount: "5.0 SOL", time: "10 min ago", status: "active" },
  ])

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trojan SOL Bot Admin</h1>
          <p className="text-gray-400">Monitor bot performance and user activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-2xl font-bold text-white">${stats.totalVolume.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-2xl font-bold text-white">{stats.totalTrades.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Bots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Bot className="h-4 w-4 text-cyan-400 mr-2" />
                <span className="text-2xl font-bold text-white">{stats.activeBots.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-2xl font-bold text-white">{stats.successRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
              User Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              Bot Settings
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-slate-700">
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription>Latest user actions and bot operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <div>
                          <p className="text-white font-medium">{activity.user}</p>
                          <p className="text-gray-400 text-sm">{activity.action}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{activity.amount}</p>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              activity.status === "success"
                                ? "default"
                                : activity.status === "active"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                          <span className="text-gray-400 text-xs">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">User Statistics</h3>
                    <Button variant="outline" className="bg-slate-700 border-slate-600 text-white">
                      Export Users
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">New Users (24h)</p>
                      <p className="text-2xl font-bold text-white">1,247</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Premium Users</p>
                      <p className="text-2xl font-bold text-white">8,934</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Banned Users</p>
                      <p className="text-2xl font-bold text-white">127</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Referrals</p>
                      <p className="text-2xl font-bold text-white">23,456</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Bot Configuration</CardTitle>
                <CardDescription>Global bot settings and parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Trading Settings</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Max Slippage</span>
                          <span className="text-white">15%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Min Trade Amount</span>
                          <span className="text-white">0.01 SOL</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Max Trade Amount</span>
                          <span className="text-white">100 SOL</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Security Settings</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Rate Limiting</span>
                          <Badge variant="secondary">Enabled</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">MEV Protection</span>
                          <Badge variant="secondary">Enabled</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Anti-Bot Measures</span>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  System Alerts
                </CardTitle>
                <CardDescription>Monitor system health and issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-white font-medium">High API Usage</p>
                        <p className="text-gray-400 text-sm">Solana RPC calls approaching limit</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      Warning
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-green-400"></div>
                      <div>
                        <p className="text-white font-medium">All Systems Operational</p>
                        <p className="text-gray-400 text-sm">Bot is running smoothly</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      Healthy
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
