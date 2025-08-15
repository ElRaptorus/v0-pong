"use client"

import { useEffect, useState } from "react"
import type { GameState, GameSettings } from "@/app/page"

interface TournamentLevelSelectProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export default function TournamentLevelSelect({
  onStateChange,
  settings,
  onSettingsChange,
}: TournamentLevelSelectProps) {
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [bestScores, setBestScores] = useState<Record<number, string>>({})

  useEffect(() => {
    // Load completed levels and best scores
    const completed = JSON.parse(localStorage.getItem("pongTournamentCompletedLevels") || "[]")
    const scores = JSON.parse(localStorage.getItem("pongTournamentBestScores") || "{}")

    setCompletedLevels(completed)
    setBestScores(scores)
    setSelectedLevel(settings.selectedLevel)
  }, [settings.selectedLevel])

  const isLevelUnlocked = (level: number) => {
    if (level === 1) return true
    return completedLevels.includes(level - 1)
  }

  const handleLevelClick = (level: number) => {
    if (isLevelUnlocked(level)) {
      setSelectedLevel(level)
    }
  }

  const handlePlayLevel = () => {
    onSettingsChange({ ...settings, gameMode: "tournament", selectedLevel })
    onStateChange("game")
  }

  const renderLevelGrid = () => {
    const levels = []
    for (let i = 1; i <= 50; i++) {
      const isUnlocked = isLevelUnlocked(i)
      const isCompleted = completedLevels.includes(i)
      const isSelected = selectedLevel === i

      levels.push(
        <button
          key={i}
          onClick={() => handleLevelClick(i)}
          disabled={!isUnlocked}
          className={`
            w-12 h-12 border-2 font-bold text-sm transition-colors
            ${
              isSelected
                ? "border-yellow-400 bg-yellow-400 text-black"
                : isCompleted
                  ? "border-green-400 bg-green-400 text-black hover:bg-green-300"
                  : isUnlocked
                    ? "border-green-400 bg-black text-green-400 hover:bg-green-400 hover:text-black"
                    : "border-gray-600 bg-black text-gray-600 cursor-not-allowed"
            }
          `}
        >
          {i}
        </button>,
      )
    }
    return levels
  }

  return (
    <div className="text-center space-y-6">
      <div className="border-2 border-green-400 p-6 bg-black">
        <h1 className="text-3xl font-bold mb-4 tracking-wider">TOURNAMENT LEVEL SELECTION</h1>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 bg-green-400"></div>
            <span>COMPLETED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 bg-black"></div>
            <span>UNLOCKED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-600 bg-black"></div>
            <span>LOCKED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-400"></div>
            <span>SELECTED</span>
          </div>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-10 gap-2 mb-6 justify-center">{renderLevelGrid()}</div>

        {/* Selected Level Info */}
        <div className="border border-green-400 p-4 mb-6">
          <h3 className="text-xl font-bold mb-2">LEVEL {selectedLevel}</h3>
          {isLevelUnlocked(selectedLevel) ? (
            <div className="space-y-2">
              <p className="text-sm">
                STATUS:{" "}
                {completedLevels.includes(selectedLevel) ? (
                  <span className="text-green-400">COMPLETED</span>
                ) : (
                  <span className="text-yellow-400">UNLOCKED</span>
                )}
              </p>
              {bestScores[selectedLevel] && (
                <p className="text-sm">
                  BEST SCORE: <span className="text-green-300">{bestScores[selectedLevel]}</span>
                </p>
              )}
              {!bestScores[selectedLevel] && completedLevels.includes(selectedLevel) && (
                <p className="text-sm text-gray-400">NO SCORE RECORDED</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">LEVEL LOCKED - COMPLETE LEVEL {selectedLevel - 1} FIRST</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handlePlayLevel}
            disabled={!isLevelUnlocked(selectedLevel)}
            className={`
              block w-full py-3 px-6 border-2 font-bold text-xl tracking-wide transition-colors
              ${
                isLevelUnlocked(selectedLevel)
                  ? "border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black"
                  : "border-gray-600 bg-black text-gray-600 cursor-not-allowed"
              }
            `}
          >
            PLAY LEVEL {selectedLevel}
          </button>

          <button
            onClick={() => onStateChange("tournament")}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            BACK TO TOURNAMENT
          </button>
        </div>
      </div>

      {/* Progress Info */}
      <div className="text-sm border border-green-400 p-4">
        <p>PROGRESS: {completedLevels.length}/50 LEVELS COMPLETED</p>
        {completedLevels.length > 0 && <p>HIGHEST COMPLETED: LEVEL {Math.max(...completedLevels)}</p>}
      </div>
    </div>
  )
}
