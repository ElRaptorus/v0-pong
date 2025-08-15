import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function GET(request: NextRequest, { params }: { params: { lobbyId: string } }) {
  try {
    console.log("[v0] Fetching lobby:", params.lobbyId)
    const lobbyData = await redis.get(`pongLobby_${params.lobbyId}`)
    console.log("[v0] Raw lobby data:", lobbyData)
    console.log("[v0] Lobby data type:", typeof lobbyData)

    if (!lobbyData) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    const lobby = typeof lobbyData === "string" ? JSON.parse(lobbyData) : lobbyData
    console.log("[v0] Processed lobby:", lobby)

    return NextResponse.json({ lobby })
  } catch (error) {
    console.error("Error fetching lobby:", error)
    return NextResponse.json({ error: "Failed to fetch lobby" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { lobbyId: string } }) {
  try {
    const updates = await request.json()

    const lobbyData = await redis.get(`pongLobby_${params.lobbyId}`)

    if (!lobbyData) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    const lobby = typeof lobbyData === "string" ? JSON.parse(lobbyData) : lobbyData

    // Update lobby data
    Object.assign(lobby, updates)
    lobby.lastActivity = new Date().toISOString()

    // Save updated lobby with 1 hour expiration
    await redis.setex(`pongLobby_${params.lobbyId}`, 3600, JSON.stringify(lobby))

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error("Error updating lobby:", error)
    return NextResponse.json({ error: "Failed to update lobby" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { lobbyId: string } }) {
  try {
    await redis.del(`pongLobby_${params.lobbyId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lobby:", error)
    return NextResponse.json({ error: "Failed to delete lobby" }, { status: 500 })
  }
}
