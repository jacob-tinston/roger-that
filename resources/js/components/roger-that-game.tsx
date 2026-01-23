import { Link, usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import { ChevronLeft, HelpCircle } from "lucide-react"
import { history, register } from "@/routes"
import { type SharedData } from "@/types"
import { AccountButton } from "./account-button"
import { CelebrityCard } from "./celebrity-card"
import { GuessInput } from "./guess-input"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { cn } from "@/lib/utils"


type GameState = "playing" | "won" | "lost"

interface Answer {
  name: string
  year: number
  tagline: string
  photo_url: string | null
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase() || parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function AnswerCard({ answer }: { answer: Answer }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showPhoto = Boolean(answer.photo_url) && !imgFailed
  const initials = getInitials(answer.name)

  return (
    <div className="max-w-[250px] mx-auto rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-lg">
      <div className="aspect-square relative">
        {showPhoto ? (
          <img
            src={answer.photo_url!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral/20 to-coral/40 flex items-center justify-center">
              <span className="text-3xl font-display font-bold text-coral/60">{initials}</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 text-center">
        <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{answer.name}</h3>
        <p className="text-slate-400 text-sm mt-1 font-body">Born {answer.year}</p>
        <p className="text-coral text-xs mt-2 italic font-body">{answer.tagline}</p>
      </div>
    </div>
  )
}

interface Subject {
  id: number
  name: string
  year: number
  hint: string
  photo_url: string | null
}

interface GameSettings {
  SUBTITLES?: string[]
  REACTIONS?: {
    wrong?: string[]
    close?: string[]
  }
  BUTTON_COPY?: string[]
  WIN_CAPTIONS?: string[]
  WIN_SUB_CAPTIONS?: string[]
  LOSE_CAPTIONS?: string[]
  LOSE_SUB_CAPTIONS?: string[]
}

interface RogerThatGameProps {
  subjects: Subject[]
  gameDate: string
  guessUrl: string
  previousGameUrl: string | null
  settings: GameSettings
}

export function RogerThatGame({ subjects, gameDate, guessUrl, previousGameUrl, settings }: RogerThatGameProps) {
  const SUBTITLES = settings.SUBTITLES || []
  const REACTIONS = settings.REACTIONS || { wrong: [], close: [] }
  const BUTTON_COPY = settings.BUTTON_COPY || []
  const WIN_CAPTIONS = settings.WIN_CAPTIONS || []
  const WIN_SUB_CAPTIONS = settings.WIN_SUB_CAPTIONS || []
  const LOSE_CAPTIONS = settings.LOSE_CAPTIONS || []
  const LOSE_SUB_CAPTIONS = settings.LOSE_SUB_CAPTIONS || []
  const [subtitle, setSubtitle] = useState("")
  const [guessesRemaining, setGuessesRemaining] = useState(5)
  const [currentGuess, setCurrentGuess] = useState("")
  const [reaction, setReaction] = useState("")
  const [gameState, setGameState] = useState<GameState>("playing")
  const [matchedCards, setMatchedCards] = useState<number[]>([])
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [resultCaption, setResultCaption] = useState("")
  const [resultSubCaption, setResultSubCaption] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [guessing, setGuessing] = useState(false)
  const [isWrongGuess, setIsWrongGuess] = useState(false)

  const { auth } = usePage<SharedData>().props
  const user = auth?.user

  useEffect(() => {
    if (SUBTITLES.length > 0) {
      setSubtitle(SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)])
    }
  }, [])

  const getCsrfToken = (): string =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

  const handleGuess = async () => {
    const guess = currentGuess.trim()
    if (!guess || gameState !== "playing" || guessing) return

    setGuessing(true)
    try {
      const res = await fetch(guessUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ guess, is_last_guess: guessesRemaining === 1, game_date: gameDate }),
      })
      const data = (await res.json()) as {
        correct?: boolean
        gameOver?: boolean
        answer?: Answer
      }

      if (data.correct) {
        setGameState("won")
        setAnswer(data.answer ?? null)
        if (WIN_CAPTIONS.length > 0) {
          setResultCaption(WIN_CAPTIONS[Math.floor(Math.random() * WIN_CAPTIONS.length)])
        }
        if (WIN_SUB_CAPTIONS.length > 0) {
          setResultSubCaption(WIN_SUB_CAPTIONS[Math.floor(Math.random() * WIN_SUB_CAPTIONS.length)])
        }
        setMatchedCards(subjects.map((s) => s.id))
        setIsWrongGuess(false)
        return
      }

      if (data.gameOver && data.answer) {
        setGameState("lost")
        setAnswer(data.answer)
        if (LOSE_CAPTIONS.length > 0) {
          setResultCaption(LOSE_CAPTIONS[Math.floor(Math.random() * LOSE_CAPTIONS.length)])
        }
        if (LOSE_SUB_CAPTIONS.length > 0) {
          setResultSubCaption(LOSE_SUB_CAPTIONS[Math.floor(Math.random() * LOSE_SUB_CAPTIONS.length)])
        }
        // Keep red outline on game over
        setIsWrongGuess(true)
        return
      }

      // Wrong guess - trigger shake and red outline
      setIsWrongGuess(true)
      setGuessesRemaining((g) => g - 1)
      if (REACTIONS.wrong && REACTIONS.wrong.length > 0) {
        setReaction(REACTIONS.wrong[Math.floor(Math.random() * REACTIONS.wrong.length)])
      }
      setCurrentGuess("")
      
      // Clear wrong guess animation after animation completes
      setTimeout(() => {
        setIsWrongGuess(false)
      }, 500)
    } finally {
      setGuessing(false)
    }
  }

  const getButtonText = () => {
    if (BUTTON_COPY.length === 0) {
      return 'Submit'
    }
    const index = Math.min(5 - guessesRemaining, BUTTON_COPY.length - 1)
    return BUTTON_COPY[index]
  }

  // Determine outline color based on game state
  const getGameCardOutline = () => {
    if (gameState === "won") {
      return "ring-2 ring-emerald-400 ring-offset-2"
    }
    if (gameState === "lost" || isWrongGuess) {
      return "ring-2 ring-red-400 ring-offset-2"
    }
    return ""
  }

  return (
    <div className="w-full max-w-lg">
      {/* Modal */}
      <div
        className={cn(
          "bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1",
          getGameCardOutline(),
          isWrongGuess && gameState === "playing" && "animate-shake"
        )}
      >
        {/* Help Icon */}
        <button
          onClick={() => setShowHelp(true)}
          className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          aria-label="How to play"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Account Icon */}
        <AccountButton />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Roger That</h1>
          <p className="mt-2 text-slate-500 font-body text-sm md:text-base italic">{subtitle || "Loading..."}</p>
        </div>

        {gameState === "playing" && (
          <>
            {/* Celebrity Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {subjects.map((celeb) => (
                <CelebrityCard
                  key={celeb.id}
                  name={celeb.name}
                  year={celeb.year}
                  hint={celeb.hint}
                  photoUrl={celeb.photo_url}
                  isMatched={matchedCards.includes(celeb.id)}
                  isLocked={gameState !== "playing"}
                />
              ))}
            </div>

            {/* Guess Input */}
            <GuessInput
              value={currentGuess}
              onChange={setCurrentGuess}
              onSubmit={handleGuess}
              buttonText={getButtonText()}
              guessesRemaining={guessesRemaining}
              disabled={guessing}
            />

            {/* Reaction */}
            {reaction && (
              <p className="text-center mt-4 text-slate-600 font-body text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                {reaction}
              </p>
            )}

            {/* Guesses Remaining */}
            <div className="mt-6 flex justify-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    i < guessesRemaining ? "bg-coral" : "bg-slate-200",
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Win State */}
        {gameState === "won" && (
          <div className="text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="text-4xl mb-4">👌👈😏</div>
            {answer && <AnswerCard answer={answer} />}
            <h2 className="font-display text-xl font-black text-slate-900 mt-6">{resultCaption}</h2>
            {resultSubCaption && (
              <p className="mt-2 text-slate-400 font-body text-sm">{resultSubCaption}</p>
            )}
            <div className="mt-8 space-y-4">
              {user ? (
                previousGameUrl ? (
                  <Button variant="coral" asChild>
                    <Link href={previousGameUrl}>
                      Keep the action going
                    </Link>
                  </Button>
                ) : null
              ) : (
                <Button variant="coral" asChild>
                  <Link href={register().url}>
                    Notify me of the next Rogering
                  </Link>
                </Button>
              )}
              <Button variant="secondary" asChild>
                <Link href={history().url}>
                  View past games
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Lose State */}
        {gameState === "lost" && (
          <div className="text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="text-4xl mb-4">👎💩😔</div>
            {answer && <AnswerCard answer={answer} />}
            <h2 className="font-display text-xl font-black text-slate-900 mt-6">{resultCaption}</h2>
            {resultSubCaption && (
              <p className="mt-2 text-slate-400 font-body text-sm">{resultSubCaption}</p>
            )}
            <div className="mt-8 space-y-4">
              {user ? (
                previousGameUrl ? (
                  <Button variant="coral" asChild>
                    <Link href={previousGameUrl}>
                      Keep the action going
                    </Link>
                  </Button>
                ) : null
              ) : (
                <Button variant="coral" asChild>
                  <Link href={register().url}>
                    Notify me of the next Rogering
                  </Link>
                </Button>
              )}
              <Button variant="secondary" asChild>
                <Link href={history().url}>
                  View past games
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-8 md:p-10 border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
              How to Play
            </DialogTitle>
            <DialogDescription className="text-left mt-4">
              <div className="space-y-4 text-slate-600 font-body text-sm md:text-base">
                <p>
                  <strong className="text-slate-900 font-semibold font-body">Meet the Ladies:</strong> You'll be shown four women. Different careers, different vibes… one thing in common. Someone's been busy.
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold font-body">Spot the Culprit:</strong> Your job is to figure out which man has Rogered all four. Use gossip, pop culture, collaborations, and your questionable instincts.
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold font-body">Take your Shot:</strong> You get five guesses. Each one brings you closer to the truth—or deeper into regret.
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold font-body">Nail It or Walk Away:</strong> Guess right and enjoy the bragging rights. Guess wrong and watch the rogue slip away… until tomorrow.
                </p>
                <p className="text-sm italic text-slate-500 pt-2">
                  Pro tip: Think red carpets, late nights, “just friends,” and suspiciously well-timed breakups. The clues are there if you know where to look.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

    </div>
  )
}
