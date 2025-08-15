import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

export async function POST(request: NextRequest) {
  console.log("[v0] API Route /api/lobby/create called")
  console.log("[v0] Request method:", request.method)
  console.log("[v0] Request URL:", request.url)

  try {
    console.log("[v0] Creating lobby - checking environment variables")
    console.log("[v0] KV_REST_API_URL exists:", !!process.env.KV_REST_API_URL)
    console.log("[v0] KV_REST_API_TOKEN exists:", !!process.env.KV_REST_API_TOKEN)
    console.log("[v0] KV_URL exists:", !!process.env.KV_URL)
    console.log("[v0] REDIS_URL exists:", !!process.env.REDIS_URL)

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error("[v0] Missing Redis environment variables")
      return NextResponse.json(
        {
          error: "Redis configuration missing",
          debug: {
            hasUrl: !!process.env.KV_REST_API_URL,
            hasToken: !!process.env.KV_REST_API_TOKEN,
            hasKvUrl: !!process.env.KV_URL,
            hasRedisUrl: !!process.env.REDIS_URL,
          },
        },
        { status: 500 },
      )
    }

    console.log("[v0] Initializing Redis client")
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })

    console.log("[v0] Testing Redis connection")
    await redis.ping()
    console.log("[v0] Redis connection successful")

    console.log("[v0] Parsing request body")
    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { lobbyId, hostName, pointsToWin } = body

    if (!lobbyId || !hostName) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: { lobbyId, hostName, pointsToWin },
        },
        { status: 400 },
      )
    }

    const lobbyData = {
      id: lobbyId,
      host: hostName,
      guest: null,
      hostReady: false,
      guestReady: false,
      pointsToWin: pointsToWin || 10,
      messages: [
        {
          id: Date.now(),
          text: `${hostName} created the lobby`,
          isSystem: true,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    }

    console.log("[v0] Attempting to store lobby in Redis")
    console.log("[v0] Lobby data:", lobbyData)

    // Store lobby with 1 hour expiration
    const result = await redis.setex(`pongLobby_${lobbyId}`, 3600, JSON.stringify(lobbyData))
    console.log("[v0] Redis setex result:", result)
    console.log("[v0] Lobby stored successfully")

    const response = { success: true, lobby: lobbyData }
    console.log("[v0] Sending response:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error creating lobby:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to create lobby",
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  console.log("[v0] API Route /api/lobby/create GET called")
  return NextResponse.json({
    message: "API route is working",
    timestamp: new Date().toISOString(),
    env: {
      hasUrl: !!process.env.KV_REST_API_URL,
      hasToken: !!process.env.KV_REST_API_TOKEN,
    },
  })
}
