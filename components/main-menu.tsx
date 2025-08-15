"use client"

import type { GameState, GameSettings } from "@/app/page"

interface MainMenuProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
}

export default function MainMenu({ onStateChange, settings }: MainMenuProps) {
  return (
    <div className="text-center space-y-8">
      <div className="border-2 border-green-400 p-8 bg-black">
        <h1 className="text-6xl font-bold mb-4 tracking-wider">PONG</h1>
        <p className="text-lg mb-2">CLASSIC ARCADE GAME</p>
        <p className="text-sm mb-8 text-green-300">PLAYER: {settings.playerName}</p>

        <div className="space-y-4">
          <button
            onClick={() => onStateChange("timestart")}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            TIME MODE
          </button>

          <button
            onClick={() => onStateChange("survivorstart")}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            SURVIVOR MODE
          </button>

          <button
            onClick={() => onStateChange("multiplayerlobby")}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            MULTIPLAYER
          </button>

          <button
            onClick={() => onStateChange("halloffame")}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            SURVIVOR HALL OF FAME
          </button>

          <button
            onClick={() => onStateChange("settings")}
            className="block w-full py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
          >
            SETTINGS
          </button>
        </div>
      </div>

      <div className="text-sm space-y-2 border border-green-400 p-4">
        <p>CONTROLS:</p>
        <p>W/S - MOVE LEFT PADDLE UP/DOWN</p>
        <p>UP/DOWN ARROWS - MOVE RIGHT PADDLE (MULTIPLAYER)</p>
        <p>ESC - RETURN TO MENU</p>
      </div>
    </div>
  )
}
