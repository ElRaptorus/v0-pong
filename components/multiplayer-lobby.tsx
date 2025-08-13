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
  messages: Array<{ player: string; message: string; timestamp: number }>
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
  const [chatMessages, setChatMessages] = useState<Array<{ player: string; message: string; timestamp: number }>>([])
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

  const saveLobbyData = (data: LobbyData) => {
    localStorage.setItem(`pongLobby_${data.id}`, JSON.stringify(data))
  }

  const loadLobbyData = (id: string): LobbyData | null => {
    const data = localStorage.getItem(`pongLobby_${id}`)
    return data ? JSON.parse(data) : null
  }

  const createLobby = () => {
    const newLobbyId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const lobbyData: LobbyData = {
      id: newLobbyId,
      host: settings.playerName,
      hostReady: false,
      guestReady: false,
      pointsToWin: pointsToWin,
      messages: [
        {
          player: "SYSTEM",
          message: `${settings.playerName} created the lobby`,
          timestamp: Date.now(),
        },
      ],
    }

    setLobbyId(newLobbyId)
    setIsHost(true)
    setIsConnected(true)
    setConnectionStatus("connected")
    setChatMessages(lobbyData.messages)
    saveLobbyData(lobbyData)

    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("lobby", newLobbyId)
    window.history.pushState({}, "", newUrl.toString())
  }

  const joinLobby = (id: string) => {
    setConnectionStatus("connecting")
    const lobbyData = loadLobbyData(id)

    if (!lobbyData) {
      alert("LOBBY NOT FOUND!")
      setConnectionStatus("disconnected")
      return
    }

    if (lobbyData.guest && lobbyData.guest !== settings.playerName) {
      alert("LOBBY IS FULL!")
      setConnectionStatus("disconnected")
      return
    }

    lobbyData.guest = settings.playerName
    lobbyData.messages.push({
      player: "SYSTEM",
      message: `${settings.playerName} joined the lobby`,
      timestamp: Date.now(),
    })

    setLobbyId(id)
    setIsHost(false)
    setIsConnected(true)
    setConnectionStatus("connected")
    setOpponentName(lobbyData.host)
    setOpponentReady(lobbyData.hostReady)
    setPointsToWin(lobbyData.pointsToWin)
    setChatMessages(lobbyData.messages)
    saveLobbyData(lobbyData)

    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("lobby", id)
    window.history.pushState({}, "", newUrl.toString())
  }

  const sendMessage = () => {
    if (chatInput.trim() && lobbyId) {
      const newMessage = {
        player: settings.playerName,
        message: chatInput.trim(),
        timestamp: Date.now(),
      }

      setChatMessages((prev) => [...prev, newMessage])
      setChatInput("")

      const lobbyData = loadLobbyData(lobbyId)
      if (lobbyData) {
        lobbyData.messages.push(newMessage)
        saveLobbyData(lobbyData)
      }
    }
  }

  const toggleReady = () => {
    const newReadyState = !playerReady
    setPlayerReady(newReadyState)

    const lobbyData = loadLobbyData(lobbyId)
    if (lobbyData) {
      if (isHost) {
        lobbyData.hostReady = newReadyState
      } else {
        lobbyData.guestReady = newReadyState
      }
      saveLobbyData(lobbyData)
    }
  }

  const updatePointsToWin = (points: number) => {
    if (isHost) {
      setPointsToWin(points)
      const lobbyData = loadLobbyData(lobbyId)
      if (lobbyData) {
        lobbyData.pointsToWin = points
        saveLobbyData(lobbyData)
      }
    }
  }

  const startGame = () => {
    if (isHost && playerReady && opponentReady) {
      onSettingsChange({ ...settings, gameMode: "multiplayer", pointsToWin })
      onStateChange("game")
    }
  }

  const leaveLobby = () => {
    if (lobbyId) {
      const lobbyData = loadLobbyData(lobbyId)
      if (lobbyData) {
        if (isHost) {
          // Host leaving - remove lobby
          localStorage.removeItem(`pongLobby_${lobbyId}`)
        } else {
          // Guest leaving - remove guest from lobby
          lobbyData.guest = undefined
          lobbyData.guestReady = false
          lobbyData.messages.push({
            player: "SYSTEM",
            message: `${settings.playerName} left the lobby`,
            timestamp: Date.now(),
          })
          saveLobbyData(lobbyData)
        }
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
      const interval = setInterval(() => {
        const lobbyData = loadLobbyData(lobbyId)
        if (lobbyData) {
          if (isHost) {
            setOpponentName(lobbyData.guest || "")
            setOpponentReady(lobbyData.guestReady)
          } else {
            setOpponentReady(lobbyData.hostReady)
            setPointsToWin(lobbyData.pointsToWin)
          }
          setChatMessages(lobbyData.messages)
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
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span
                  className={
                    msg.player === "SYSTEM"
                      ? "text-gray-400"
                      : msg.player === settings.playerName
                        ? "text-green-400"
                        : "text-yellow-400"
                  }
                >
                  {msg.player}:
                </span>{" "}
                {msg.message}
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
