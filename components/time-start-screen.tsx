"use client"

import { useState, useEffect } from "react"
import type { GameState, GameSettings } from "@/app/page"

interface TimeStartScreenProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export default function TimeStartScreen({ onStateChange, settings, onSettingsChange }: TimeStartScreenProps) {
  const [showLevelSelect, setShowLevelSelect] = useState(false)
  const [completedLevels, setCompletedLevels] = useState<number[]>([])

  useEffect(() => {
    const levels = JSON.parse(localStorage.getItem("pongCompletedLevels") || "[]")
    setCompletedLevels(levels)
  }, [settings.selectedLevel])

  const handleLevelSelect = (level: number) => {
    onSettingsChange({ ...settings, selectedLevel: level, gameMode: "time" })
    setShowLevelSelect(false)
  }

  const handleStartGame = () => {
    onSettingsChange({ ...settings, gameMode: "time" })
    onStateChange("game")
  }

  const maxUnlockedLevel = Math.max(1, ...completedLevels) + (completedLevels.length > 0 ? 1 : 0)

  if (showLevelSelect) {
    return (
      <div className="text-center space-y-6">
        <div className="border-2 border-green-400 p-8 bg-black">
          <h2 className="text-4xl font-bold mb-6 tracking-wider">LEVEL SELECT</h2>
          <p className="text-lg mb-6">CHOOSE YOUR DIFFICULTY LEVEL</p>

          <div className="grid grid-cols-10 gap-2 mb-6 max-h-64 overflow-y-auto">
            {Array.from({ length: 50 }, (_, i) => i + 1).map((level) => {
              const isUnlocked = level <= maxUnlockedLevel
              const isCompleted = completedLevels.includes(level)

              return (
                <button
                  key={level}
                  onClick={() => (isUnlocked ? handleLevelSelect(level) : null)}
                  disabled={!isUnlocked}
                  className={`
                    p-2 border text-sm font-bold transition-colors
                    ${
                      isCompleted
                        ? "border-yellow-400 bg-yellow-400 text-black"
                        : isUnlocked
                          ? "border-green-400 bg-black text-green-400 hover:bg-green-400 hover:text-black"
                          : "border-gray-600 bg-gray-800 text-gray-600 cursor-not-allowed"
                    }
                  `}
                >
                  {level}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowLevelSelect(false)}
              className="py-2 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors font-bold"
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      <div className="border-2 border-green-400 p-8 bg-black">
        <h2 className="text-4xl font-bold mb-6 tracking-wider">TIME MODE</h2>

        <div className="text-left space-y-4 mb-8 border border-green-400 p-4">
          <h3 className="text-xl font-bold text-center">GAME RULES:</h3>
          <p>• 60 SECOND MATCHES</p>
          <p>• PLAYER WITH MOST POINTS WINS</p>
          <p>• AI DIFFICULTY BASED ON SELECTED LEVEL</p>
          <p>• COMPLETE LEVELS TO UNLOCK HIGHER DIFFICULTIES</p>
          <p>• CURRENT LEVEL: {settings.selectedLevel}</p>
          <p>• COMPLETED LEVELS: {completedLevels.length}/50</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowLevelSelect(true)}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            SELECT LEVEL
          </button>

          <button
            onClick={handleStartGame}
            className="block w-full py-3 px-6 border-2 border-yellow-400 bg-black hover:bg-yellow-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            START GAME
          </button>

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
