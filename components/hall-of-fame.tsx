"use client"

import { useEffect, useState } from "react"
import type { GameState } from "@/app/page"

interface SurvivorEntry {
  name: string
  score: number
  maxDifficulty: number
  result: "player" | "opponent" | "draw"
  date: string
}

interface HallOfFameProps {
  onStateChange: (state: GameState) => void
}

export default function HallOfFame({ onStateChange }: HallOfFameProps) {
  const [survivorEntries, setSurvivorEntries] = useState<SurvivorEntry[]>([])

  useEffect(() => {
    const survivorHallOfFame = JSON.parse(localStorage.getItem("pongSurvivorHallOfFame") || "[]")
    setSurvivorEntries(survivorHallOfFame)
  }, [])

  const clearHallOfFame = () => {
    if (confirm("CLEAR ALL SURVIVOR HALL OF FAME ENTRIES?")) {
      localStorage.removeItem("pongSurvivorHallOfFame")
      setSurvivorEntries([])
    }
  }

  return (
    <div className="text-center space-y-6">
      <div className="border-2 border-green-400 p-6 bg-black">
        <h1 className="text-4xl font-bold mb-6 tracking-wider">SURVIVOR HALL OF FAME</h1>

        <p className="text-lg mb-6">SURVIVOR MODE CHAMPIONS</p>

        {survivorEntries.length === 0 ? (
          <div className="text-xl py-8">NO ENTRIES YET</div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-4 text-lg font-bold border-b-2 border-green-400 pb-2">
              <div>RANK</div>
              <div>NAME</div>
              <div>SCORE</div>
              <div>LEVEL</div>
              <div>DATE</div>
            </div>

            {survivorEntries.map((entry, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 text-lg py-1">
                <div>{index + 1}</div>
                <div>{entry.name}</div>
                <div>{entry.score}</div>
                <div>{entry.maxDifficulty}</div>
                <div>{entry.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onStateChange("menu")}
          className="py-3 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-xl font-bold tracking-wide"
        >
          BACK TO MENU
        </button>

        {survivorEntries.length > 0 && (
          <button
            onClick={clearHallOfFame}
            className="py-2 px-4 border border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors text-sm"
          >
            CLEAR SURVIVOR HALL OF FAME
          </button>
        )}
      </div>
    </div>
  )
}
