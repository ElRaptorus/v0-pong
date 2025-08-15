"use client"

import { useState, useEffect } from "react"
import type { GameState, GameSettings } from "@/app/page"

interface MultiplayerLobbyProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  lobbyId: string
  setLobbyId: (id: string) => void
}

interface LobbyData {
  id: string
  host: string
  guest?: string
  hostReady: boolean
  guestReady: boolean
  pointsToWin: number
  messages: Array<{
    id: number
    text: string
    player?: string
    isSystem: boolean
    timestamp: string
  }>
  createdAt: string
  lastActivity: string
}

export default function MultiplayerLobby({
  onStateChange,
  settings,
  onSettingsChange,
  lobbyId,
  setLobbyId,
}: MultiplayerLobbyProps) {
  const [isHost, setIsHost] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [opponentReady, setOpponentReady] = useState(false)
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: number
      text: string
      player?: string
      isSystem: boolean
      timestamp: string
    }>
  >([])
  const [chatInput, setChatInput] = useState("")
  const [opponentName, setOpponentName] = useState("")
  const [pointsToWin, setPointsToWin] = useState(settings.pointsToWin)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [joinLobbyInput, setJoinLobbyInput] = useState("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlLobbyId = urlParams.get("lobby")
    if (urlLobbyId && urlLobbyId.length === 6) {
      setJoinLobbyInput(urlLobbyId.toUpperCase())
    }
  }, [])

  const createLobby = async () => {
    const newLobbyId = Math.random().toString(36).substring(2, 8).toUpperCase()

    try {
      console.log("[v0] Creating lobby with ID:", newLobbyId)

      console.log("[v0] Testing API route accessibility")
      const testResponse = await fetch("/api/lobby/create", {
        method: "GET",
      })

      console.log("[v0] Test response status:", testResponse.status)
      console.log("[v0] Test response content-type:", testResponse.headers.get("content-type"))

      if (!testResponse.headers.get("content-type")?.includes("application/json")) {
        console.error("[v0] API route not accessible - getting HTML instead of JSON")
        throw new Error("API routes not accessible - check deployment")
      }

      const testData = await testResponse.json()
      console.log("[v0] Test response data:", testData)

      console.log("[v0] API route accessible, proceeding with lobby creation")
      const response = await fetch("/api/lobby/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: newLobbyId,
          hostName: settings.playerName,
          pointsToWin: pointsToWin,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Error response text:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      console.log("[v0] Response text:", responseText)

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] JSON parse error:", parseError)
        console.log("[v0] Raw response:", responseText)
        throw new Error("Invalid JSON response from server")
      }

      const { lobby } = responseData

      setLobbyId(newLobbyId)
      setIsHost(true)
      setIsConnected(true)
      setConnectionStatus("connected")
      setChatMessages(lobby.messages)

      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set("lobby", newLobbyId)
      window.history.pushState({}, "", newUrl.toString())
    } catch (error) {
      console.error("[v0] Error creating lobby:", error)
      alert(`FAILED TO CREATE LOBBY: ${error instanceof Error ? error.message : "Unknown error"}`)
      setConnectionStatus("disconnected")
    }
  }

  const joinLobby = async (id: string) => {
    setConnectionStatus("connecting")

    try {
      const response = await fetch("/api/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: id,
          guestName: settings.playerName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to join lobby")
      }

      const { lobby } = await response.json()

      setLobbyId(id)
      setIsHost(false)
      setIsConnected(true)
      setConnectionStatus("connected")
      setOpponentName(lobby.host)
      setOpponentReady(lobby.hostReady)
      setPointsToWin(lobby.pointsToWin)
      setChatMessages(lobby.messages)

      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set("lobby", id)
      window.history.pushState({}, "", newUrl.toString())
    } catch (error) {
      console.error("Error joining lobby:", error)
      alert(error instanceof Error ? error.message.toUpperCase() : "FAILED TO JOIN LOBBY!")
      setConnectionStatus("disconnected")
    }
  }

  const sendMessage = async () => {
    if (chatInput.trim() && lobbyId) {
      try {
        const response = await fetch(`/api/lobby/${lobbyId}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: chatInput.trim(),
            playerName: settings.playerName,
          }),
        })

        if (response.ok) {
          setChatInput("")
        }
      } catch (error) {
        console.error("Error sending message:", error)
      }
    }
  }

  const toggleReady = async () => {
    const newReadyState = !playerReady
    setPlayerReady(newReadyState)

    try {
      const updates = isHost ? { hostReady: newReadyState } : { guestReady: newReadyState }

      await fetch(`/api/lobby/${lobbyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error("Error updating ready state:", error)
      // Revert on error
      setPlayerReady(!newReadyState)
    }
  }

  const updatePointsToWin = async (points: number) => {
    if (isHost) {
      setPointsToWin(points)

      try {
        await fetch(`/api/lobby/${lobbyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pointsToWin: points }),
        })
      } catch (error) {
        console.error("Error updating points to win:", error)
      }
    }
  }

  const startGame = () => {
    if (isHost && playerReady && opponentReady) {
      onSettingsChange({
        ...settings,
        gameMode: "multiplayer",
        pointsToWin,
      })
      onStateChange("game")
    }
  }

  const leaveLobby = async () => {
    if (lobbyId) {
      try {
        if (isHost) {
          // Host leaving - delete lobby
          await fetch(`/api/lobby/${lobbyId}`, { method: "DELETE" })
        } else {
          // Guest leaving - remove guest from lobby
          await fetch(`/api/lobby/${lobbyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guest: null,
              guestReady: false,
            }),
          })
        }
      } catch (error) {
        console.error("Error leaving lobby:", error)
      }
    }

    // Clear URL params
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete("lobby")
    window.history.pushState({}, "", newUrl.toString())

    onStateChange("menu")
  }

  useEffect(() => {
    if (isConnected && lobbyId) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/lobby/${lobbyId}`)
          if (response.ok) {
            const { lobby } = await response.json()

            if (isHost) {
              setOpponentName(lobby.guest || "")
              setOpponentReady(lobby.guestReady)
            } else {
              setOpponentReady(lobby.hostReady)
              setPointsToWin(lobby.pointsToWin)
            }
            setChatMessages(lobby.messages)
          }
        } catch (error) {
          console.error("Error polling lobby:", error)
        }
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isConnected, lobbyId, isHost])

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}${
    typeof window !== "undefined" ? window.location.pathname : ""
  }?lobby=${lobbyId}`

  if (!isConnected) {
    return (
      <div className="text-center space-y-6">
        <div className="border-2 border-green-400 p-8 bg-black">
          <h2 className="text-4xl font-bold mb-6 tracking-wider">MULTIPLAYER LOBBY</h2>

          <div className="text-left space-y-4 mb-8 border border-green-400 p-4">
            <h3 className="text-xl font-bold text-center">GAME RULES:</h3>
            <p>• TWO PLAYERS COMPETE HEAD-TO-HEAD</p>
            <p>• FIRST PLAYER TO REACH TARGET POINTS WINS</p>
            <p>• LEFT PLAYER: W/S KEYS</p>
            <p>• RIGHT PLAYER: UP/DOWN ARROW KEYS</p>
            <p>• HOST CONTROLS GAME SETTINGS</p>
          </div>

          {connectionStatus === "connecting" && (
            <div className="mb-6 p-4 border border-yellow-400">
              <p className="text-yellow-400 font-bold">CONNECTING TO LOBBY...</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={createLobby}
              disabled={connectionStatus === "connecting"}
              className="block w-full py-3 px-6 border-2 border-yellow-400 bg-black hover:bg-yellow-400 hover:text-black transition-colors text-xl font-bold tracking-wide disabled:opacity-50"
            >
              CREATE LOBBY
            </button>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="ENTER LOBBY CODE"
                value={joinLobbyInput}
                onChange={(e) => setJoinLobbyInput(e.target.value.toUpperCase())}
                className="w-full p-3 bg-black border-2 border-green-400 text-green-400 font-mono text-center uppercase"
                maxLength={6}
                disabled={connectionStatus === "connecting"}
              />
              <button
                onClick={() => joinLobby(joinLobbyInput)}
                disabled={joinLobbyInput.length !== 6 || connectionStatus === "connecting"}
                className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                JOIN LOBBY
              </button>
            </div>

            <button
              onClick={() => onStateChange("menu")}
              className="block w-full py-2 px-6 border border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors font-bold"
            >
              BACK TO MENU
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      <div className="border-2 border-green-400 p-8 bg-black">
        <h2 className="text-4xl font-bold mb-6 tracking-wider">LOBBY: {lobbyId}</h2>

        {isHost && (
          <div className="mb-6 p-4 border border-yellow-400">
            <p className="text-yellow-400 font-bold mb-2">SHARE THIS LINK:</p>
            <input
              type="text"
              value={shareLink}
              readOnly
              className="w-full p-2 bg-black border border-green-400 text-green-400 font-mono text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={() => navigator.clipboard?.writeText(shareLink)}
              className="mt-2 px-4 py-1 border border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-sm"
            >
              COPY LINK
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-green-400 p-4">
            <h3 className="font-bold mb-2">
              {settings.playerName} {isHost ? "(HOST)" : ""}
            </h3>
            <label className="flex items-center justify-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={playerReady} onChange={toggleReady} className="w-4 h-4" />
              <span>READY</span>
            </label>
          </div>
          <div className="border border-green-400 p-4">
            <h3 className="font-bold mb-2">{opponentName || "WAITING FOR PLAYER..."}</h3>
            <div className="flex items-center justify-center">
              <span className={opponentName ? (opponentReady ? "text-green-400" : "text-red-400") : "text-gray-400"}>
                {opponentName ? (opponentReady ? "READY" : "NOT READY") : "---"}
              </span>
            </div>
          </div>
        </div>

        {isHost && (
          <div className="mb-6 p-4 border border-green-400">
            <label className="block mb-2 font-bold">POINTS TO WIN:</label>
            <input
              type="number"
              value={pointsToWin}
              onChange={(e) => updatePointsToWin(Math.max(1, Number.parseInt(e.target.value) || 10))}
              className="w-20 p-2 bg-black border border-green-400 text-green-400 font-mono text-center"
              min="1"
              max="50"
            />
          </div>
        )}

        {!isHost && (
          <div className="mb-6 p-4 border border-green-400">
            <p className="font-bold">POINTS TO WIN: {pointsToWin}</p>
            <p className="text-sm text-gray-400">(SET BY HOST)</p>
          </div>
        )}

        <div className="mb-6 border border-green-400 p-4 h-32 overflow-y-auto text-left">
          <h3 className="font-bold mb-2 text-center">CHAT</h3>
          <div className="space-y-1">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span
                  className={
                    msg.isSystem
                      ? "text-gray-400"
                      : msg.player === settings.playerName
                        ? "text-green-400"
                        : "text-yellow-400"
                  }
                >
                  {msg.isSystem ? "SYSTEM" : msg.player}:
                </span>{" "}
                {msg.text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-2 mb-6">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="TYPE MESSAGE..."
            className="flex-1 p-2 bg-black border border-green-400 text-green-400 font-mono"
            maxLength={50}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 border border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors"
          >
            SEND
          </button>
        </div>

        <div className="space-y-4">
          {isHost && (
            <button
              onClick={startGame}
              disabled={!playerReady || !opponentReady || !opponentName}
              className="block w-full py-3 px-6 border-2 border-yellow-400 bg-black hover:bg-yellow-400 hover:text-black transition-colors text-xl font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!opponentName
                ? "WAITING FOR PLAYER..."
                : !playerReady || !opponentReady
                  ? "WAITING FOR READY..."
                  : "START GAME"}
            </button>
          )}

          {!isHost && (
            <div className="p-4 border border-gray-400 text-gray-400">
              <p>WAITING FOR HOST TO START GAME...</p>
            </div>
          )}

          <button
            onClick={leaveLobby}
            className="block w-full py-2 px-6 border border-red-400 bg-black hover:bg-red-400 hover:text-black transition-colors font-bold"
          >
            LEAVE LOBBY
          </button>
        </div>
      </div>
    </div>
  )
}
