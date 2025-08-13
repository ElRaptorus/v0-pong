"use client"

import type { GameState, GameSettings } from "@/app/page"

interface SurvivorStartScreenProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
}

export default function SurvivorStartScreen({ onStateChange, settings }: SurvivorStartScreenProps) {
  const handleStartGame = () => {
    onStateChange("game")
  }

  return (
    <div className="text-center space-y-6">
      <div className="border-2 border-green-400 p-8 bg-black">
        <h2 className="text-4xl font-bold mb-6 tracking-wider">SURVIVOR MODE</h2>

        <div className="text-left space-y-4 mb-8 border border-green-400 p-4">
          <h3 className="text-xl font-bold text-center">GAME RULES:</h3>
          <p>• SURVIVE AS LONG AS POSSIBLE</p>
          <p>• AI DIFFICULTY INCREASES EVERY 5 POINTS YOU SCORE</p>
          <p>• GAME ENDS WHEN COMPUTER SCORES 10 POINTS</p>
          <p>• TRY TO SCORE AS MANY POINTS AS POSSIBLE</p>
          <p>• ULTIMATE TEST OF SKILL AND ENDURANCE</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleStartGame}
            className="block w-full py-3 px-6 border-2 border-yellow-400 bg-black hover:bg-yellow-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            START SURVIVOR MODE
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
