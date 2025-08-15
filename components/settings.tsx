"use client"

import { useState } from "react"
import type { GameState, GameSettings, GameMode } from "@/app/page"

interface SettingsProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export default function Settings({ onStateChange, settings, onSettingsChange }: SettingsProps) {
  const [tempPlayerName, setTempPlayerName] = useState(settings.playerName)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handlePointsChange = (points: number) => {
    onSettingsChange({ ...settings, pointsToWin: points })
  }

  const handleGameModeChange = (gameMode: GameMode) => {
    onSettingsChange({ ...settings, gameMode })
  }

  const handlePlayerNameChange = () => {
    const name = tempPlayerName.trim().toUpperCase().substring(0, 25) || "PLAYER"
    onSettingsChange({ ...settings, playerName: name })
    setTempPlayerName(name)
  }

  const handleResetTimeMode = () => {
    // Clear all Time Mode related localStorage data
    localStorage.removeItem("pongCompletedLevels")
    localStorage.removeItem("pongTimeBestScores")
    setShowResetConfirm(false)
  }

  return (
    <div className="text-center space-y-6">
      <div className="border-2 border-green-400 p-6 bg-black">
        <h1 className="text-4xl font-bold mb-6 tracking-wider">SETTINGS</h1>

        <div className="space-y-6">
          <div className="text-left">
            <label className="block text-xl font-bold mb-4">PLAYER NAME:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tempPlayerName}
                onChange={(e) => setTempPlayerName(e.target.value)}
                maxLength={25} // Increased from 10 to 25
                className="flex-1 py-2 px-4 border-2 border-green-400 bg-black text-green-400 font-mono"
                placeholder="ENTER NAME"
              />
              <button
                onClick={handlePlayerNameChange}
                className="py-2 px-4 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors"
              >
                SET
              </button>
            </div>
            <div className="text-xs text-green-300 mt-1">{tempPlayerName.length}/25 CHARACTERS</div>
          </div>

          <div className="text-left">
            <label className="block text-xl font-bold mb-4">GAME MODE:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleGameModeChange("time")}
                className={`py-3 px-4 border-2 transition-colors ${
                  settings.gameMode === "time"
                    ? "border-green-400 bg-green-400 text-black"
                    : "border-green-400 bg-black hover:bg-green-400 hover:text-black"
                }`}
              >
                TIME MODE
              </button>
              <button
                onClick={() => handleGameModeChange("multiplayer")}
                className={`py-3 px-4 border-2 transition-colors ${
                  settings.gameMode === "multiplayer"
                    ? "border-green-400 bg-green-400 text-black"
                    : "border-green-400 bg-black hover:bg-green-400 hover:text-black"
                }`}
              >
                MULTIPLAYER
              </button>
              <button
                onClick={() => handleGameModeChange("survivor")}
                className={`py-3 px-4 border-2 transition-colors ${
                  settings.gameMode === "survivor"
                    ? "border-green-400 bg-green-400 text-black"
                    : "border-green-400 bg-black hover:bg-green-400 hover:text-black"
                }`}
              >
                SURVIVOR
              </button>
            </div>
          </div>

          {settings.gameMode === "multiplayer" && (
            <div className="text-left">
              <label className="block text-xl font-bold mb-4">POINTS TO WIN:</label>
              <div className="grid grid-cols-5 gap-2">
                {[5, 10, 15, 20, 25].map((points) => (
                  <button
                    key={points}
                    onClick={() => handlePointsChange(points)}
                    className={`py-2 px-4 border-2 transition-colors ${
                      settings.pointsToWin === points
                        ? "border-green-400 bg-green-400 text-black"
                        : "border-green-400 bg-black hover:bg-green-400 hover:text-black"
                    }`}
                  >
                    {points}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-left border-t border-green-400 pt-4">
            <h3 className="text-lg font-bold mb-4">RESET PROGRESS:</h3>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="py-2 px-4 border-2 border-red-400 bg-black text-red-400 hover:bg-red-400 hover:text-black transition-colors font-bold"
            >
              RESET TIME MODE PROGRESS
            </button>
          </div>

          <div className="text-left border-t border-green-400 pt-4">
            <h3 className="text-lg font-bold mb-4">GAME INFO:</h3>
            <div className="text-sm space-y-1">
              {settings.gameMode === "time" ? (
                <>
                  <p>• 60 SECOND TIME LIMIT</p>
                  <p>• SCORE AS MANY POINTS AS POSSIBLE</p>
                  <p>• PLAYER WITH MOST POINTS WINS</p>
                  <p>• AI DIFFICULTY BASED ON SELECTED LEVEL</p>
                  <p>• USE LEVEL SELECT TO CHOOSE DIFFICULTY</p>
                </>
              ) : settings.gameMode === "survivor" ? (
                <>
                  <p>• ENDLESS SURVIVAL MODE</p>
                  <p>• AI DIFFICULTY INCREASES EVERY 5 POINTS</p>
                  <p>• GAME ENDS WHEN COMPUTER SCORES 10 POINTS</p>
                  <p>• TRY TO SCORE AS MANY POINTS AS POSSIBLE</p>
                  <p>• ULTIMATE TEST OF SKILL AND ENDURANCE</p>
                </>
              ) : (
                <>
                  <p>• TWO PLAYER LOCAL MULTIPLAYER</p>
                  <p>• FIRST TO REACH TARGET POINTS WINS</p>
                  <p>• PLAYER 1: W/S KEYS</p>
                  <p>• PLAYER 2: UP/DOWN ARROW KEYS</p>
                  <p>• CLASSIC HEAD-TO-HEAD COMPETITION</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="border-2 border-red-400 bg-black p-6 max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-400">WARNING!</h2>
            <p className="mb-6 text-green-400">THIS WILL PERMANENTLY DELETE ALL TIME MODE PROGRESS INCLUDING:</p>
            <ul className="text-left mb-6 text-green-400 text-sm">
              <li>• ALL COMPLETED LEVELS</li>
              <li>• ALL BEST SCORES</li>
            </ul>
            <p className="mb-6 text-red-400 font-bold">THIS ACTION CANNOT BE UNDONE!</p>
            <div className="flex space-x-4">
              <button
                onClick={handleResetTimeMode}
                className="flex-1 py-2 px-4 border-2 border-red-400 bg-red-400 text-black hover:bg-black hover:text-red-400 transition-colors font-bold"
              >
                YES, RESET ALL
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 px-4 border-2 border-green-400 bg-black text-green-400 hover:bg-green-400 hover:text-black transition-colors font-bold"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => onStateChange("menu")}
        className="py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
      >
        BACK TO MENU
      </button>
    </div>
  )
}
