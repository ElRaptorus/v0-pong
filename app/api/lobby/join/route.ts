import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const { lobbyId, guestName } = await request.json()

    const lobbyData = await redis.get(`pongLobby_${lobbyId}`)

    if (!lobbyData) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    const lobby = JSON.parse(lobbyData as string)

    if (lobby.guest) {
      return NextResponse.json({ error: "Lobby is full" }, { status: 400 })
    }

    // Add guest to lobby
    lobby.guest = guestName
    lobby.guestReady = false
    lobby.messages.push({
      id: Date.now(),
      text: `${guestName} joined the lobby`,
      isSystem: true,
      timestamp: new Date().toISOString(),
    })
    lobby.lastActivity = new Date().toISOString()

    // Update lobby with 1 hour expiration
    await redis.setex(`pongLobby_${lobbyId}`, 3600, JSON.stringify(lobby))

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error("Error joining lobby:", error)
    return NextResponse.json({ error: "Failed to join lobby" }, { status: 500 })
  }
}
