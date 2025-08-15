"use client"

import { useEffect, useState } from "react"
import type { GameState, GameSettings } from "@/app/page"

interface TournamentMenuProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export default function TournamentMenu({ onStateChange, settings, onSettingsChange }: TournamentMenuProps) {
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [currentLevel, setCurrentLevel] = useState(1)

  useEffect(() => {
    // Load completed levels from localStorage
    const completed = JSON.parse(localStorage.getItem("pongTournamentCompletedLevels") || "[]")
    setCompletedLevels(completed)

    // Set current level to highest unlocked level
    const highestLevel = completed.length > 0 ? Math.max(...completed) + 1 : 1
    const clampedLevel = Math.min(highestLevel, 50)
    setCurrentLevel(clampedLevel)

    // Update settings with current level
    onSettingsChange({ ...settings, gameMode: "tournament", selectedLevel: clampedLevel })
  }, [])

  const handleStartGame = () => {
    onSettingsChange({ ...settings, gameMode: "tournament", selectedLevel: currentLevel })
    onStateChange("game")
  }

  const handleSelectLevel = () => {
    onStateChange("tournamentlevelselect")
  }

  return (
    <div className="text-center space-y-8">
      <div className="border-2 border-green-400 p-8 bg-black">
        <h1 className="text-4xl font-bold mb-6 tracking-wider">TOURNAMENT MODE</h1>

        {/* Rules Overview */}
        <div className="text-left mb-8 space-y-4 border border-green-400 p-6">
          <h2 className="text-2xl font-bold text-center mb-4">TOURNAMENT RULES</h2>
          <div className="space-y-2 text-sm">
            <p>• COMPETE THROUGH 50 PROGRESSIVELY DIFFICULT LEVELS</p>
            <p>• WIN {settings.pointsToWin} POINTS TO COMPLETE EACH LEVEL</p>
            <p>• AI DIFFICULTY INCREASES WITH EACH LEVEL</p>
            <p>• UNLOCK NEW LEVELS BY COMPLETING PREVIOUS ONES</p>
            <p>• TRACK YOUR BEST SCORES FOR EACH LEVEL</p>
          </div>
        </div>

        {/* Current Progress */}
        <div className="mb-8 space-y-4">
          <div className="border border-green-400 p-4">
            <h3 className="text-xl font-bold mb-2">CURRENT PROGRESS</h3>
            <p className="text-lg">
              CURRENT LEVEL: <span className="text-yellow-400 font-bold">{currentLevel}</span>
            </p>
            <p className="text-sm">
              LEVELS COMPLETED: <span className="text-green-300">{completedLevels.length}/50</span>
            </p>
            {completedLevels.length > 0 && (
              <p className="text-xs mt-2">HIGHEST COMPLETED: LEVEL {Math.max(...completedLevels)}</p>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleStartGame}
            className="block w-full py-3 px-6 border-2 border-yellow-400 bg-black hover:bg-yellow-400 hover:text-black transition-colors text-xl font-bold tracking-wide text-yellow-400"
          >
            START GAME
          </button>

          <button
            onClick={handleSelectLevel}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            SELECT LEVEL
          </button>

          <button
            onClick={() => onStateChange("menu")}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            BACK TO MENU
          </button>
        </div>
      </div>

      {/* Controls Info */}
      <div className="text-sm space-y-2 border border-green-400 p-4">
        <p>TOURNAMENT CONTROLS:</p>
        <p>W/S - MOVE PADDLE UP/DOWN</p>
        <p>SPACE - PAUSE GAME</p>
        <p>ESC - RETURN TO MENU</p>
      </div>
    </div>
  )
}
