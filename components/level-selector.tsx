"use client"

import { useEffect, useState } from "react"
import type { GameState, GameSettings } from "@/app/page"

interface LevelSelectorProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export default function LevelSelector({ onStateChange, settings, onSettingsChange }: LevelSelectorProps) {
  const [completedLevels, setCompletedLevels] = useState<number[]>([])

  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem("pongCompletedLevels") || "[1]")
    setCompletedLevels(completed.sort((a: number, b: number) => a - b))
  }, [])

  const selectLevel = (level: number) => {
    onSettingsChange({ ...settings, selectedLevel: level, gameMode: "time" })
    onStateChange("game")
  }

  return (
    <div className="text-center space-y-6">
      <div className="border-2 border-green-400 p-6 bg-black">
        <h2 className="text-4xl font-bold mb-6 tracking-wider">LEVEL SELECT</h2>
        <p className="text-lg mb-6">CHOOSE YOUR DIFFICULTY LEVEL</p>

        <div className="grid grid-cols-10 gap-2 mb-6">
          {Array.from({ length: 50 }, (_, i) => i + 1).map((level) => {
            const isCompleted = completedLevels.includes(level)
            const isSelected = settings.selectedLevel === level

            return (
              <button
                key={level}
                onClick={() => isCompleted && selectLevel(level)}
                disabled={!isCompleted}
                className={`
                  w-12 h-12 border-2 text-sm font-bold transition-colors
                  ${
                    isCompleted
                      ? isSelected
                        ? "border-green-400 bg-green-400 text-black"
                        : "border-green-400 bg-black text-green-400 hover:bg-green-400 hover:text-black"
                      : "border-gray-600 bg-black text-gray-600 cursor-not-allowed"
                  }
                `}
              >
                {level}
              </button>
            )
          })}
        </div>

        <div className="space-y-4">
          <div className="text-sm space-y-2 border border-green-400 p-4">
            <p>SELECTED LEVEL: {settings.selectedLevel}</p>
            <p>AI DIFFICULTY: {Math.min(95, 30 + settings.selectedLevel * 1.3).toFixed(0)}%</p>
            <p>BALL SPEED: {(3 + settings.selectedLevel * 0.2).toFixed(1)}</p>
          </div>

          <button
            onClick={() => onStateChange("menu")}
            className="py-2 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors"
          >
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  )
}
