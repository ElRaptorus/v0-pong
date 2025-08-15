import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest, { params }: { params: { lobbyId: string } }) {
  try {
    const { message, playerName } = await request.json()

    const lobbyData = await redis.get(`pongLobby_${params.lobbyId}`)

    if (!lobbyData) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    const lobby = JSON.parse(lobbyData as string)

    // Add new message
    const newMessage = {
      id: Date.now(),
      text: message,
      player: playerName,
      isSystem: false,
      timestamp: new Date().toISOString(),
    }

    lobby.messages.push(newMessage)
    lobby.lastActivity = new Date().toISOString()

    // Keep only last 50 messages to prevent memory issues
    if (lobby.messages.length > 50) {
      lobby.messages = lobby.messages.slice(-50)
    }

    // Save updated lobby with 1 hour expiration
    await redis.setex(`pongLobby_${params.lobbyId}`, 3600, JSON.stringify(lobby))

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error) {
    console.error("Error adding message:", error)
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
  }
}
