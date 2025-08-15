"use client"

import { useState } from "react"
import PongGame from "@/components/pong-game"
import MainMenu from "@/components/main-menu"
import HallOfFame from "@/components/hall-of-fame"
import Settings from "@/components/settings"
import LevelSelector from "@/components/level-selector"
import TimeStartScreen from "@/components/time-start-screen"
import SurvivorStartScreen from "@/components/survivor-start-screen"
import MultiplayerLobby from "@/components/multiplayer-lobby"

export type GameState =
  | "menu"
  | "game"
  | "halloffame"
  | "settings"
  | "levelselect"
  | "timestart"
  | "multiplayerlobby"
  | "survivorstart"
export type GameMode = "time" | "multiplayer" | "survivor"

export interface GameSettings {
  pointsToWin: number
  gameMode: GameMode
  playerName: string
  selectedLevel: number
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("menu")
  const [settings, setSettings] = useState<GameSettings>({
    pointsToWin: 10,
    gameMode: "time",
    playerName: "PLAYER",
    selectedLevel: 1,
  })

  const [lobbyId, setLobbyId] = useState<string>("")

  const handleLevelComplete = (completedLevel: number) => {
    // Save completed level to localStorage
    const completedLevels = JSON.parse(localStorage.getItem("pongCompletedLevels") || "[]")
    if (!completedLevels.includes(completedLevel)) {
      completedLevels.push(completedLevel)
      localStorage.setItem("pongCompletedLevels", JSON.stringify(completedLevels))
    }
  }

  const resetLevelProgression = () => {
    localStorage.removeItem("pongCompletedLevels")
    localStorage.removeItem("pongTimeHallOfFame")
    setSettings((prev) => ({ ...prev, selectedLevel: 1 }))
  }

  // Call this once to reset progression (remove this after first run)
  // resetLevelProgression()

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {gameState === "menu" && <MainMenu onStateChange={setGameState} settings={settings} />}
        {gameState === "timestart" && (
          <TimeStartScreen onStateChange={setGameState} settings={settings} onSettingsChange={setSettings} />
        )}
        {gameState === "survivorstart" && (
          <SurvivorStartScreen onStateChange={setGameState} settings={settings} onSettingsChange={setSettings} />
        )}
        {gameState === "multiplayerlobby" && (
          <MultiplayerLobby
            onStateChange={setGameState}
            settings={settings}
            onSettingsChange={setSettings}
            lobbyId={lobbyId}
            setLobbyId={setLobbyId}
          />
        )}
        {gameState === "game" && (
          <PongGame onStateChange={setGameState} settings={settings} onLevelComplete={handleLevelComplete} />
        )}
        {gameState === "halloffame" && <HallOfFame onStateChange={setGameState} />}
        {gameState === "settings" && (
          <Settings onStateChange={setGameState} settings={settings} onSettingsChange={setSettings} />
        )}
        {gameState === "levelselect" && (
          <LevelSelector onStateChange={setGameState} settings={settings} onSettingsChange={setSettings} />
        )}
      </div>
    </div>
  )
}
