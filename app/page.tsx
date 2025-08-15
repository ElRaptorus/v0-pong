"use client"

import { useState } from "react"
import PongGame from "@/components/pong-game"
import MainMenu from "@/components/main-menu"
import HallOfFame from "@/components/hall-of-fame"
import Settings from "@/components/settings"
import TournamentMenu from "@/components/tournament-menu"
import TournamentLevelSelect from "@/components/tournament-level-select"
import SurvivorStartScreen from "@/components/survivor-start-screen"
import MultiplayerLobby from "@/components/multiplayer-lobby"

export type GameState =
  | "menu"
  | "game"
  | "halloffame"
  | "settings"
  | "tournament"
  | "tournamentlevelselect"
  | "multiplayerlobby"
  | "survivorstart"

export type GameMode = "tournament" | "multiplayer" | "survivor"

export interface GameSettings {
  pointsToWin: number
  gameMode: GameMode
  playerName: string
  selectedLevel: number
}

export interface TournamentSettings {
  selectedLevel: number
}

export interface MultiplayerSettings {
  pointsToWin: number
}

export type SurvivorSettings = {}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("menu")

  const [globalSettings, setGlobalSettings] = useState({
    gameMode: "tournament" as GameMode,
    playerName: "PLAYER",
  })

  const [tournamentSettings, setTournamentSettings] = useState<TournamentSettings>({
    selectedLevel: 1,
  })

  const [multiplayerSettings, setMultiplayerSettings] = useState<MultiplayerSettings>({
    pointsToWin: 10,
  })

  const [survivorSettings, setSurvivorSettings] = useState<SurvivorSettings>({})

  const [lobbyId, setLobbyId] = useState<string>("")

  const getCombinedSettings = (): GameSettings => {
    const baseSettings = {
      gameMode: globalSettings.gameMode,
      playerName: globalSettings.playerName,
    }

    switch (globalSettings.gameMode) {
      case "tournament":
        return {
          ...baseSettings,
          selectedLevel: tournamentSettings.selectedLevel,
          pointsToWin: 10, // Tournament always uses 10 points
        }
      case "multiplayer":
        return {
          ...baseSettings,
          selectedLevel: 1, // Not used in multiplayer
          pointsToWin: multiplayerSettings.pointsToWin,
        }
      case "survivor":
        return {
          ...baseSettings,
          selectedLevel: 1, // Not used in survivor
          pointsToWin: 10, // Survivor uses fixed 10 points for computer
        }
      default:
        return {
          ...baseSettings,
          selectedLevel: 1,
          pointsToWin: 10,
        }
    }
  }

  const handleSettingsChange = (newSettings: Partial<GameSettings>) => {
    if (newSettings.gameMode !== undefined) {
      setGlobalSettings((prev) => ({ ...prev, gameMode: newSettings.gameMode! }))
    }
    if (newSettings.playerName !== undefined) {
      setGlobalSettings((prev) => ({ ...prev, playerName: newSettings.playerName! }))
    }
    if (newSettings.selectedLevel !== undefined && globalSettings.gameMode === "tournament") {
      setTournamentSettings((prev) => ({ ...prev, selectedLevel: newSettings.selectedLevel! }))
    }
    if (newSettings.pointsToWin !== undefined && globalSettings.gameMode === "multiplayer") {
      setMultiplayerSettings((prev) => ({ ...prev, pointsToWin: newSettings.pointsToWin! }))
    }
  }

  const handleLevelComplete = (completedLevel: number) => {
    const completedLevels = JSON.parse(localStorage.getItem("pongTournamentCompletedLevels") || "[]")
    if (!completedLevels.includes(completedLevel)) {
      completedLevels.push(completedLevel)
      localStorage.setItem("pongTournamentCompletedLevels", JSON.stringify(completedLevels))
    }

    setTournamentSettings((prev) => ({ ...prev, selectedLevel: completedLevel + 1 }))
  }

  const resetTournamentProgression = () => {
    localStorage.removeItem("pongTournamentCompletedLevels")
    localStorage.removeItem("pongTournamentBestScores")
    setTournamentSettings({ selectedLevel: 1 })
  }

  const currentSettings = getCombinedSettings()

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {gameState === "menu" && <MainMenu onStateChange={setGameState} settings={currentSettings} />}
        {gameState === "tournament" && (
          <TournamentMenu
            onStateChange={setGameState}
            settings={currentSettings}
            onSettingsChange={handleSettingsChange}
          />
        )}
        {gameState === "tournamentlevelselect" && (
          <TournamentLevelSelect
            onStateChange={setGameState}
            settings={currentSettings}
            onSettingsChange={handleSettingsChange}
          />
        )}
        {gameState === "survivorstart" && (
          <SurvivorStartScreen
            onStateChange={setGameState}
            settings={currentSettings}
            onSettingsChange={handleSettingsChange}
          />
        )}
        {gameState === "multiplayerlobby" && (
          <MultiplayerLobby
            onStateChange={setGameState}
            settings={currentSettings}
            onSettingsChange={handleSettingsChange}
            lobbyId={lobbyId}
            setLobbyId={setLobbyId}
          />
        )}
        {gameState === "game" && (
          <PongGame onStateChange={setGameState} settings={currentSettings} onLevelComplete={handleLevelComplete} />
        )}
        {gameState === "halloffame" && <HallOfFame onStateChange={setGameState} />}
        {gameState === "settings" && (
          <Settings
            onStateChange={setGameState}
            settings={currentSettings}
            onSettingsChange={handleSettingsChange}
            onResetTournament={resetTournamentProgression}
          />
        )}
      </div>
    </div>
  )
}
