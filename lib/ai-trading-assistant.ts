import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface TokenAnalysis {
  score: number // 0-100
  recommendation: "BUY" | "HOLD" | "SELL" | "AVOID"
  confidence: number // 0-100
  reasons: string[]
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME"
  predictedMultiplier: number
  timeframe: string
}

export interface MarketSentiment {
  overall: "BULLISH" | "BEARISH" | "NEUTRAL"
  score: number // -100 to 100
  factors: string[]
  recommendation: string
}

export interface TradingSignal {
  action: "BUY" | "SELL" | "HOLD"
  strength: number // 0-100
  reasoning: string
  targetPrice?: number
  stopLoss?: number
  timeframe: string
}

export class AITradingAssistant {
  private readonly model = openai("gpt-4o")

  async analyzeToken(tokenAddress: string, tokenData: any): Promise<TokenAnalysis> {
    try {
      const prompt = `Analyze this Solana token for trading potential:

Token Address: ${tokenAddress}
Name: ${tokenData.name || "Unknown"}
Symbol: ${tokenData.symbol || "Unknown"}
Liquidity: $${tokenData.liquidity || 0}
Market Cap: $${tokenData.marketCap || 0}
Holders: ${tokenData.holders || "Unknown"}
Age: ${tokenData.age || "Unknown"}
Volume 24h: $${tokenData.volume24h || 0}
Price Change 24h: ${tokenData.priceChange24h || 0}%
Social Media Mentions: ${tokenData.socialMentions || 0}
Developer Activity: ${tokenData.devActivity || "Unknown"}
Contract Verified: ${tokenData.verified || false}
Ownership Renounced: ${tokenData.renounced || false}

Provide a comprehensive analysis with:
1. Overall score (0-100)
2. Recommendation (BUY/HOLD/SELL/AVOID)
3. Confidence level (0-100)
4. 3-5 key reasons
5. Risk level (LOW/MEDIUM/HIGH/EXTREME)
6. Predicted multiplier potential (e.g., 2x, 10x, 100x)
7. Recommended timeframe

Focus on memecoin potential, community strength, and moonshot probability.`

      const { text } = await generateText({
        model: this.model,
        prompt,
        maxTokens: 500,
      })

      // Parse AI response into structured data
      return this.parseTokenAnalysis(text)
    } catch (error) {
      console.error("Error analyzing token:", error)
      return this.getDefaultAnalysis()
    }
  }

  async getMarketSentiment(): Promise<MarketSentiment> {
    try {
      const prompt = `Analyze the current Solana memecoin market sentiment based on:

Recent market trends, social media activity, major token launches, 
overall crypto market conditions, and trading volumes.

Provide:
1. Overall sentiment (BULLISH/BEARISH/NEUTRAL)
2. Sentiment score (-100 to 100)
3. 3-5 key factors influencing sentiment
4. Trading recommendation for the next 24-48 hours

Focus on memecoin opportunities and market timing.`

      const { text } = await generateText({
        model: this.model,
        prompt,
        maxTokens: 300,
      })

      return this.parseMarketSentiment(text)
    } catch (error) {
      console.error("Error getting market sentiment:", error)
      return {
        overall: "NEUTRAL",
        score: 0,
        factors: ["Unable to analyze market conditions"],
        recommendation: "Exercise caution and wait for clearer signals",
      }
    }
  }

  async generateTradingSignal(tokenAddress: string, currentPrice: number, userPosition?: any): Promise<TradingSignal> {
    try {
      const positionInfo = userPosition
        ? `Current position: ${userPosition.amount} tokens, Entry: $${userPosition.entryPrice}, PnL: ${userPosition.pnlPercent}%`
        : "No current position"

      const prompt = `Generate a trading signal for token ${tokenAddress}:

Current Price: $${currentPrice}
${positionInfo}

Consider:
- Technical analysis patterns
- Market momentum
- Risk/reward ratio
- Optimal entry/exit points
- Current market conditions

Provide:
1. Action (BUY/SELL/HOLD)
2. Signal strength (0-100)
3. Clear reasoning
4. Target price (if applicable)
5. Stop loss level (if applicable)
6. Recommended timeframe

Be specific and actionable.`

      const { text } = await generateText({
        model: this.model,
        prompt,
        maxTokens: 300,
      })

      return this.parseTradingSignal(text)
    } catch (error) {
      console.error("Error generating trading signal:", error)
      return {
        action: "HOLD",
        strength: 50,
        reasoning: "Unable to generate signal due to analysis error",
        timeframe: "1-4 hours",
      }
    }
  }

  async optimizeSniperSettings(userStats: any, marketConditions: any): Promise<any> {
    try {
      const prompt = `Optimize sniper settings based on:

User Stats:
- Success Rate: ${userStats.successRate}%
- Total Snipes: ${userStats.totalSnipes}
- Average Profit: ${userStats.averageProfit}%
- Best Performance: ${userStats.bestMultiplier}x

Market Conditions:
- Volatility: ${marketConditions.volatility}
- New Token Rate: ${marketConditions.newTokenRate}/hour
- Average Liquidity: $${marketConditions.avgLiquidity}
- Success Rate Trend: ${marketConditions.successTrend}

Recommend optimal:
1. Buy amount (SOL)
2. Min liquidity threshold
3. Max market cap
4. Slippage tolerance
5. Filters to enable/disable

Focus on maximizing profitable snipes while minimizing losses.`

      const { text } = await generateText({
        model: this.model,
        prompt,
        maxTokens: 400,
      })

      return this.parseOptimizerRecommendations(text)
    } catch (error) {
      console.error("Error optimizing settings:", error)
      return this.getDefaultSettings()
    }
  }

  async predictTokenPotential(tokenData: any): Promise<{ multiplier: number; confidence: number; timeframe: string }> {
    try {
      const prompt = `Predict the potential multiplier for this token:

${JSON.stringify(tokenData, null, 2)}

Based on similar successful tokens, market patterns, and current conditions,
predict the realistic maximum multiplier (e.g., 2x, 10x, 100x) with confidence level.

Provide:
1. Predicted multiplier
2. Confidence percentage
3. Expected timeframe to reach target

Be realistic but consider moonshot potential.`

      const { text } = await generateText({
        model: this.model,
        prompt,
        maxTokens: 200,
      })

      return this.parsePotentialPrediction(text)
    } catch (error) {
      console.error("Error predicting potential:", error)
      return { multiplier: 2, confidence: 50, timeframe: "1-7 days" }
    }
  }

  private parseTokenAnalysis(text: string): TokenAnalysis {
    // Extract structured data from AI response
    const scoreMatch = text.match(/score[:\s]*(\d+)/i)
    const score = scoreMatch ? Number.parseInt(scoreMatch[1]) : 50

    const recommendationMatch = text.match(/(BUY|HOLD|SELL|AVOID)/i)
    const recommendation = (recommendationMatch?.[1]?.toUpperCase() as any) || "HOLD"

    const confidenceMatch = text.match(/confidence[:\s]*(\d+)/i)
    const confidence = confidenceMatch ? Number.parseInt(confidenceMatch[1]) : 50

    const riskMatch = text.match(/(LOW|MEDIUM|HIGH|EXTREME)/i)
    const riskLevel = (riskMatch?.[1]?.toUpperCase() as any) || "MEDIUM"

    const multiplierMatch = text.match(/(\d+)x/i)
    const predictedMultiplier = multiplierMatch ? Number.parseInt(multiplierMatch[1]) : 2

    return {
      score,
      recommendation,
      confidence,
      reasons: this.extractReasons(text),
      riskLevel,
      predictedMultiplier,
      timeframe: this.extractTimeframe(text),
    }
  }

  private parseMarketSentiment(text: string): MarketSentiment {
    const sentimentMatch = text.match(/(BULLISH|BEARISH|NEUTRAL)/i)
    const overall = (sentimentMatch?.[1]?.toUpperCase() as any) || "NEUTRAL"

    const scoreMatch = text.match(/score[:\s]*(-?\d+)/i)
    const score = scoreMatch ? Number.parseInt(scoreMatch[1]) : 0

    return {
      overall,
      score,
      factors: this.extractFactors(text),
      recommendation: this.extractRecommendation(text),
    }
  }

  private parseTradingSignal(text: string): TradingSignal {
    const actionMatch = text.match(/(BUY|SELL|HOLD)/i)
    const action = (actionMatch?.[1]?.toUpperCase() as any) || "HOLD"

    const strengthMatch = text.match(/strength[:\s]*(\d+)/i)
    const strength = strengthMatch ? Number.parseInt(strengthMatch[1]) : 50

    const targetMatch = text.match(/target[:\s]*\$?([\d.]+)/i)
    const targetPrice = targetMatch ? Number.parseFloat(targetMatch[1]) : undefined

    const stopLossMatch = text.match(/stop[:\s]*\$?([\d.]+)/i)
    const stopLoss = stopLossMatch ? Number.parseFloat(stopLossMatch[1]) : undefined

    return {
      action,
      strength,
      reasoning: this.extractReasoning(text),
      targetPrice,
      stopLoss,
      timeframe: this.extractTimeframe(text),
    }
  }

  private parseOptimizerRecommendations(text: string): any {
    return {
      buyAmount: this.extractNumber(text, "buy amount", 0.1),
      minLiquidity: this.extractNumber(text, "liquidity", 500),
      maxMarketCap: this.extractNumber(text, "market cap", 50000),
      slippage: this.extractNumber(text, "slippage", 15),
      reasoning: this.extractReasoning(text),
    }
  }

  private parsePotentialPrediction(text: string): { multiplier: number; confidence: number; timeframe: string } {
    const multiplierMatch = text.match(/(\d+)x/i)
    const multiplier = multiplierMatch ? Number.parseInt(multiplierMatch[1]) : 2

    const confidenceMatch = text.match(/(\d+)%/i)
    const confidence = confidenceMatch ? Number.parseInt(confidenceMatch[1]) : 50

    return {
      multiplier,
      confidence,
      timeframe: this.extractTimeframe(text),
    }
  }

  private extractReasons(text: string): string[] {
    const reasons = []
    const lines = text.split("\n")

    for (const line of lines) {
      if (line.match(/^\d+\.|-|•/) && line.length > 10) {
        reasons.push(line.replace(/^\d+\.|-|•/, "").trim())
      }
    }

    return reasons.slice(0, 5) // Max 5 reasons
  }

  private extractFactors(text: string): string[] {
    return this.extractReasons(text)
  }

  private extractRecommendation(text: string): string {
    const lines = text.split("\n")
    const recLine = lines.find(
      (line) => line.toLowerCase().includes("recommend") || line.toLowerCase().includes("suggest"),
    )
    return recLine?.trim() || "Monitor market conditions closely"
  }

  private extractReasoning(text: string): string {
    const lines = text.split("\n")
    const reasoningLine = lines.find(
      (line) => line.toLowerCase().includes("reason") || line.toLowerCase().includes("because") || line.length > 50,
    )
    return reasoningLine?.trim() || "Analysis based on current market conditions"
  }

  private extractTimeframe(text: string): string {
    const timeframeMatch = text.match(/(\d+[-\s]?\d*\s*(hour|day|week|month)s?)/i)
    return timeframeMatch?.[0] || "1-4 hours"
  }

  private extractNumber(text: string, keyword: string, defaultValue: number): number {
    const regex = new RegExp(`${keyword}[:\\s]*(\\d+(?:\\.\\d+)?)`, "i")
    const match = text.match(regex)
    return match ? Number.parseFloat(match[1]) : defaultValue
  }

  private getDefaultAnalysis(): TokenAnalysis {
    return {
      score: 50,
      recommendation: "HOLD",
      confidence: 50,
      reasons: ["Unable to analyze token data"],
      riskLevel: "MEDIUM",
      predictedMultiplier: 2,
      timeframe: "1-4 hours",
    }
  }

  private getDefaultSettings(): any {
    return {
      buyAmount: 0.1,
      minLiquidity: 1000,
      maxMarketCap: 100000,
      slippage: 10,
      reasoning: "Default conservative settings",
    }
  }
}
