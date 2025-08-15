"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { GameState, GameSettings } from "@/app/page"

interface PongGameProps {
  onStateChange: (state: GameState) => void
  settings: GameSettings
  onLevelComplete?: (level: number) => void
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  speed: number
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
  speed: number
}

interface GameScore {
  player: number
  opponent: number
}

const ASCII_ANIMATIONS = {
  win: [
    "    *    ",
    "   ***   ",
    "  *****  ",
    " ******* ",
    "*********",
    " ******* ",
    "  *****  ",
    "   ***   ",
    "    *    ",
  ],
  lose: [
    "  BOOM!  ",
    " \\|||||/ ",
    "  \\|||/  ",
    "   \\|/   ",
    "    X    ",
    "   /|\\   ",
    "  /|||\\  ",
    " /|||||\\ ",
    "  BOOM!  ",
  ],
  draw: [
    "  :(  :( ",
    " (  )(  )",
    "  ______ ",
    " /      \\",
    "(  o  o  )",
    " \\   __  /",
    "  \\____/ ",
    "   :(    ",
    "    :(   ",
  ],
}

export default function PongGame({ onStateChange, settings, onLevelComplete }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const keysRef = useRef<Set<string>>(new Set())

  const [score, setScore] = useState<GameScore>({ player: 0, opponent: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"player" | "opponent" | "draw" | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showGameResult, setShowGameResult] = useState(false)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [shouldCompleteLevel, setShouldCompleteLevel] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [gameStarted, setGameStarted] = useState(false)

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const PADDLE_WIDTH = 10
  const PADDLE_HEIGHT = 80
  const BALL_SIZE = 10

  const getAIDifficulty = () => {
    if (settings.gameMode === "survivor") {
      const difficultyLevel = Math.floor(score.player / 5) + 1
      return Math.min(0.95, 0.3 + difficultyLevel * 0.02)
    }
    // Time Mode: 25% at level 1, 90% at level 50
    return Math.min(0.9, 0.25 + (settings.selectedLevel - 1) * (0.65 / 49))
  }

  const aiDifficulty = getAIDifficulty()

  const aiSpeed =
    settings.gameMode === "multiplayer"
      ? 6
      : settings.gameMode === "survivor"
        ? 2 + Math.floor(score.player / 5) * 0.3 + 1
        : 2.25 + Math.floor((settings.selectedLevel - 1) / 5) * 1.25 // Increase by 1.25 every 5 levels

  const ballSpeed = (() => {
    if (settings.gameMode === "survivor") {
      const difficultyLevel = Math.floor(score.player / 5)
      const speed = 3.5 + difficultyLevel * 0.25
      return Math.min(10, speed) // Cap at 10
    }
    // Time Mode: 3.5 at level 1, 12 at level 50
    return 3.5 + (settings.selectedLevel - 1) * (8.5 / 49)
  })()

  const getTimerDuration = () => {
    if (settings.gameMode !== "time") return null
    // 30s at level 1, +10s every 5 levels, cap at 60s
    const baseTime = 30
    const additionalTime = Math.floor((settings.selectedLevel - 1) / 5) * 10
    return Math.min(60, baseTime + additionalTime)
  }

  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: 3,
    dy: 2,
    speed: ballSpeed,
  })

  const playerPaddleRef = useRef<Paddle>({
    x: 20,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 6,
  })

  const opponentPaddleRef = useRef<Paddle>({
    x: CANVAS_WIDTH - 30,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: aiSpeed,
  })

  useEffect(() => {
    if (!gameStarted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (!gameStarted && countdown === 0) {
      setGameStarted(true)
      resetBall()
    }
  }, [countdown, gameStarted])

  useEffect(() => {
    if (showGameResult) {
      const interval = setInterval(() => {
        setAnimationFrame((prev) => (prev + 1) % 9)
      }, 200)
      return () => clearInterval(interval)
    }
  }, [showGameResult])

  useEffect(() => {
    const timerDuration = getTimerDuration()
    setTimeLeft(timerDuration)
  }, [settings.selectedLevel, settings.gameMode])

  useEffect(() => {
    if (settings.gameMode === "time" && timeLeft !== null && !isPaused && !gameOver && timeLeft > 0 && gameStarted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            setGameOver(true)
            if (score.player > score.opponent) {
              setWinner("player")
              setShouldCompleteLevel(true)
            } else if (score.opponent > score.player) {
              setWinner("opponent")
            } else {
              setWinner("draw")
            }
            setShowGameResult(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [settings.gameMode, isPaused, gameOver, timeLeft, score, gameStarted])

  useEffect(() => {
    if (shouldCompleteLevel && onLevelComplete) {
      onLevelComplete(settings.selectedLevel)
      setShouldCompleteLevel(false)
    }
  }, [shouldCompleteLevel, onLevelComplete, settings.selectedLevel])

  const resetBall = useCallback(() => {
    const ball = ballRef.current
    ball.x = CANVAS_WIDTH / 2
    ball.y = CANVAS_HEIGHT / 2
    const speed = ballSpeed
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * speed
    ball.dy = (Math.random() - 0.5) * 4
    ball.speed = speed
  }, [ballSpeed])

  const checkCollision = (ball: Ball, paddle: Paddle): boolean => {
    return (
      ball.x < paddle.x + paddle.width &&
      ball.x + BALL_SIZE > paddle.x &&
      ball.y < paddle.y + paddle.height &&
      ball.y + BALL_SIZE > paddle.y
    )
  }

  const updateGame = useCallback(() => {
    if (isPaused || gameOver || !gameStarted) return

    const ball = ballRef.current
    const playerPaddle = playerPaddleRef.current
    const opponentPaddle = opponentPaddleRef.current

    ball.x += ball.dx
    ball.y += ball.dy

    if (ball.y <= 0) {
      ball.y = 0
      ball.dy = Math.abs(ball.dy) + 0.5 // Ensure it bounces away with minimum speed
    }
    if (ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
      ball.y = CANVAS_HEIGHT - BALL_SIZE
      ball.dy = -Math.abs(ball.dy) - 0.5 // Ensure it bounces away with minimum speed
    }

    if (checkCollision(ball, playerPaddle)) {
      ball.dx = Math.abs(ball.dx)
      const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height
      ball.dy = (hitPos - 0.5) * 8
    }

    if (checkCollision(ball, opponentPaddle)) {
      ball.dx = -Math.abs(ball.dx)
      const hitPos = (ball.y - opponentPaddle.y) / opponentPaddle.height
      ball.dy = (hitPos - 0.5) * 8
    }

    if (ball.x < 0) {
      setScore((prev) => {
        const newScore = { ...prev, opponent: prev.opponent + 1 }

        if (settings.gameMode === "multiplayer" && newScore.opponent >= settings.pointsToWin) {
          setGameOver(true)
          setWinner("opponent")
          setShowGameResult(true)
        } else if (settings.gameMode === "survivor" && newScore.opponent >= 10) {
          setGameOver(true)
          setWinner("opponent")
          setShowGameResult(true)
        }

        return newScore
      })
      resetBall()
    }

    if (ball.x > CANVAS_WIDTH) {
      setScore((prev) => {
        const newScore = { ...prev, player: prev.player + 1 }

        if (settings.gameMode === "multiplayer" && newScore.player >= settings.pointsToWin) {
          setGameOver(true)
          setWinner("player")
          setShowGameResult(true)
        }

        return newScore
      })
      resetBall()
    }

    if (keysRef.current.has("w") || keysRef.current.has("W")) {
      playerPaddle.y = Math.max(0, playerPaddle.y - playerPaddle.speed)
    }
    if (keysRef.current.has("s") || keysRef.current.has("S")) {
      playerPaddle.y = Math.min(CANVAS_HEIGHT - playerPaddle.height, playerPaddle.y + playerPaddle.speed)
    }

    if (settings.gameMode === "multiplayer") {
      if (keysRef.current.has("ArrowUp")) {
        opponentPaddle.y = Math.max(0, opponentPaddle.y - opponentPaddle.speed)
      }
      if (keysRef.current.has("ArrowDown")) {
        opponentPaddle.y = Math.min(CANVAS_HEIGHT - opponentPaddle.height, opponentPaddle.y + opponentPaddle.speed)
      }
    } else {
      const aiTarget = ball.y - opponentPaddle.height / 2
      const currentAiSpeed = opponentPaddle.speed

      if (Math.random() < aiDifficulty) {
        if (opponentPaddle.y + opponentPaddle.height / 2 < aiTarget) {
          opponentPaddle.y = Math.min(CANVAS_HEIGHT - opponentPaddle.height, opponentPaddle.y + currentAiSpeed)
        } else {
          opponentPaddle.y = Math.max(0, opponentPaddle.y - currentAiSpeed)
        }
      }
    }
  }, [isPaused, gameOver, gameStarted, settings, resetBall, aiDifficulty])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = "#00ff00"
    ctx.fillRect(playerPaddleRef.current.x, playerPaddleRef.current.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    ctx.fillRect(opponentPaddleRef.current.x, opponentPaddleRef.current.y, PADDLE_WIDTH, PADDLE_HEIGHT)

    if (gameStarted) {
      ctx.fillRect(ballRef.current.x, ballRef.current.y, BALL_SIZE, BALL_SIZE)
    }

    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }, [gameStarted])

  const gameLoop = useCallback(() => {
    updateGame()
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, draw])

  const saveScore = useCallback(() => {
    if (settings.gameMode === "time" && (winner === "player" || winner === "draw")) {
      const hallOfFame = JSON.parse(localStorage.getItem("pongTimeHallOfFame") || "[]")
      hallOfFame.push({
        name: settings.playerName,
        score: score.player,
        opponentScore: score.opponent,
        level: settings.selectedLevel,
        result: winner,
        date: new Date().toLocaleDateString(),
      })
      hallOfFame.sort((a: any, b: any) => {
        if (a.result === "player" && b.result !== "player") return -1
        if (b.result === "player" && a.result !== "player") return 1
        return b.level - a.level || b.score - a.score
      })
      localStorage.setItem("pongTimeHallOfFame", JSON.stringify(hallOfFame.slice(0, 10)))
    } else if (settings.gameMode === "survivor") {
      const hallOfFame = JSON.parse(localStorage.getItem("pongSurvivorHallOfFame") || "[]")
      hallOfFame.push({
        name: settings.playerName,
        score: score.player,
        maxDifficulty: Math.floor(score.player / 5) + 1,
        result: winner,
        date: new Date().toLocaleDateString(),
      })
      hallOfFame.sort((a: any, b: any) => b.score - a.score)
      localStorage.setItem("pongSurvivorHallOfFame", JSON.stringify(hallOfFame.slice(0, 10)))
    }
  }, [winner, score, settings])

  useEffect(() => {
    if (gameOver && winner) {
      saveScore()
    }
  }, [gameOver, winner, saveScore])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onStateChange("menu")
        return
      }
      if (e.key === " " && gameStarted) {
        setIsPaused((prev) => !prev)
        return
      }
      keysRef.current.add(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [onStateChange, gameStarted])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  useEffect(() => {
    if (showGameResult && winner === "player" && settings.gameMode === "time") {
      const timer = setTimeout(() => {
        setShowGameResult(false)
        setGameOver(false)
        setWinner(null)
        setScore({ player: 0, opponent: 0 })
        setTimeLeft(getTimerDuration())
        setCountdown(3)
        setGameStarted(false)
        resetBall()
        // Only mark current level as completed, don't auto-progress
        const completedLevels = JSON.parse(localStorage.getItem("pongCompletedLevels") || "[]")
        if (!completedLevels.includes(settings.selectedLevel)) {
          completedLevels.push(settings.selectedLevel)
          localStorage.setItem("pongCompletedLevels", JSON.stringify(completedLevels))
        }
        // Return to time start screen instead of auto-progressing
        onStateChange("timeStart")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showGameResult, winner, settings.gameMode, settings.selectedLevel, resetBall, onStateChange])

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-between items-center border-2 border-green-400 p-4 bg-black">
        <div>
          {settings.playerName}: {score.player}
        </div>
        <div className="text-center">
          {settings.gameMode === "time" && timeLeft !== null ? (
            <div>
              <div>TIME: {timeLeft}s</div>
              <div className="text-sm">LEVEL: {settings.selectedLevel}</div>
            </div>
          ) : settings.gameMode === "survivor" ? (
            <div>
              <div>SURVIVOR MODE</div>
              <div className="text-sm">DIFFICULTY: {Math.floor(score.player / 5) + 1}</div>
            </div>
          ) : (
            <div>MULTIPLAYER</div>
          )}
        </div>
        <div>
          {settings.gameMode === "multiplayer" ? "PLAYER 2" : "COMPUTER"}: {score.opponent}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-green-400 bg-black"
        />

        {!gameStarted && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-yellow-400">{countdown}</div>
              <div className="text-2xl font-bold">GET READY!</div>
              {settings.gameMode === "multiplayer" && (
                <div className="text-lg">
                  <p>LEFT PLAYER: W/S</p>
                  <p>RIGHT PLAYER: ↑/↓</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isPaused && gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-4xl font-bold">PAUSED</div>
          </div>
        )}

        {showGameResult && gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center space-y-4 border-2 border-green-400 p-8">
              <div className="text-2xl font-mono leading-tight mb-4">
                {
                  ASCII_ANIMATIONS[winner === "player" ? "win" : winner === "opponent" ? "lose" : "draw"][
                    animationFrame
                  ]
                }
              </div>
              <div className="text-4xl font-bold">
                {winner === "player"
                  ? "YOU WIN!"
                  : winner === "opponent"
                    ? settings.gameMode === "survivor"
                      ? "GAME OVER!"
                      : "YOU LOSE!"
                    : "DRAW!"}
              </div>
              <div className="text-xl">
                FINAL SCORE: {score.player} - {score.opponent}
              </div>
              {settings.gameMode === "time" && winner === "player" && (
                <div className="text-sm text-green-300">NEXT LEVEL STARTING IN 3 SECONDS...</div>
              )}
              <button
                onClick={() => onStateChange("menu")}
                className="py-2 px-6 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-colors"
              >
                RETURN TO MENU
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm space-y-1 border border-green-400 p-2">
        <p>W/S: MOVE LEFT PADDLE | {gameStarted ? "SPACE: PAUSE |" : ""} ESC: MENU</p>
        {settings.gameMode === "multiplayer" && <p>UP/DOWN ARROWS: MOVE RIGHT PADDLE</p>}
        {settings.gameMode === "time" ? (
          <p>SCORE AS MANY POINTS AS POSSIBLE IN {getTimerDuration()}S!</p>
        ) : settings.gameMode === "survivor" ? (
          <p>SURVIVE AS LONG AS POSSIBLE! AI GETS HARDER EVERY 5 POINTS!</p>
        ) : (
          <p>FIRST TO {settings.pointsToWin} POINTS WINS!</p>
        )}
      </div>
    </div>
  )
}
