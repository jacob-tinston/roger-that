import { Link, usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import { HelpCircle, User } from "lucide-react"
import { login, logout } from "@/routes"
import { type SharedData } from "@/types"
import { CelebrityCard } from "./celebrity-card"
import { GuessInput } from "./guess-input"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { cn } from "@/lib/utils"

const SUBTITLES = [
  "One man. Four women. Five guesses.",
  "You're looking for a very busy guy.",
  "Choose wisely. History will judge you.",
  "Someone's been naughty. Find him.",
  "The audacity is palpable.",
]

const REACTIONS = {
  wrong: [
    "Ambitious. Incorrect.",
    "You're circling the right energy.",
    "That man wishes.",
    "Swing and a miss, champ.",
    "Bold theory. Wrong human.",
    "Not even close, but I admire the confidence.",
  ],
  close: ["Getting warmer...", "Oh, you're onto something.", "The plot thickens."],
}

const BUTTON_COPY = ["Take a punt", "Bold choice", "Feeling lucky?", "Roll the dice", "Last roll of the dice"]

const CELEBRITIES = [
  { id: 1, name: "Emma Stone", year: 1988, hint: "Oscar winner, red carpet regular" },
  { id: 2, name: "Blake Lively", year: 1987, hint: "No stranger to headlines" },
  { id: 3, name: "Taylor Swift", year: 1989, hint: "Writes songs about everyone" },
  { id: 4, name: "Margot Robbie", year: 1990, hint: "Australia's finest export" },
]

const CORRECT_ANSWER = "Roger Federer"

type GameState = "playing" | "won" | "lost"

export function RogerThatGame() {
  const [subtitle, setSubtitle] = useState("")
  const [guessesRemaining, setGuessesRemaining] = useState(5)
  const [currentGuess, setCurrentGuess] = useState("")
  const [reaction, setReaction] = useState("")
  const [gameState, setGameState] = useState<GameState>("playing")
  const [matchedCards, setMatchedCards] = useState<number[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [showAccount, setShowAccount] = useState(false)

  const { auth } = usePage<SharedData>().props
  const user = auth?.user

  useEffect(() => {
    setSubtitle(SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)])
  }, [])

  const handleGuess = () => {
    if (!currentGuess.trim() || gameState !== "playing") return

    if (currentGuess.toLowerCase() === CORRECT_ANSWER.toLowerCase()) {
      setGameState("won")
      setMatchedCards([1, 2, 3, 4])
      return
    }

    const newGuessesRemaining = guessesRemaining - 1
    setGuessesRemaining(newGuessesRemaining)

    if (newGuessesRemaining <= 0) {
      setGameState("lost")
      return
    }

    // Random reaction
    const reactions = REACTIONS.wrong
    setReaction(reactions[Math.floor(Math.random() * reactions.length)])
    setCurrentGuess("")
  }

  const getButtonText = () => {
    const index = Math.min(5 - guessesRemaining, BUTTON_COPY.length - 1)
    return BUTTON_COPY[index]
  }

  return (
    <div className="w-full max-w-lg">
      {/* Modal */}
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1">
        {/* Help Icon */}
        <button
          onClick={() => setShowHelp(true)}
          className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          aria-label="How to play"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Account Icon */}
        {user ? (
          <button
            onClick={() => setShowAccount(true)}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            aria-label="Account"
          >
            <User className="w-5 h-5" />
          </button>
        ) : (
          <Link
            href={login().url}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            aria-label="Log in"
          >
            <User className="w-5 h-5" />
          </Link>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Roger That</h1>
          <p className="mt-2 text-slate-500 font-body text-sm md:text-base italic">{subtitle || "Loading..."}</p>
        </div>

        {gameState === "playing" && (
          <>
            {/* Celebrity Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {CELEBRITIES.map((celeb) => (
                <CelebrityCard
                  key={celeb.id}
                  name={celeb.name}
                  year={celeb.year}
                  hint={celeb.hint}
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
          <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-6xl mb-4">😏</div>
            <h2 className="font-display text-3xl font-black text-slate-900 mb-2">Roger that</h2>
            <p className="text-slate-500 font-body">You absolute menace.</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {CORRECT_ANSWER}
            </div>
          </div>
        )}

        {/* Lose State */}
        {gameState === "lost" && (
          <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-6xl mb-4">😬</div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
              Turns out it was him. Of course it was.
            </h2>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-coral/10 text-coral rounded-full text-sm font-medium">
              {CORRECT_ANSWER}
            </div>
            <p className="mt-4 text-slate-400 font-body text-sm">Better luck tomorrow, hotshot.</p>
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
                  <strong className="text-slate-900 font-semibold">The mission:</strong> Figure out which man connects all four women. You've got five guesses. Make them count.
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">The cards:</strong> Hover over those celebrity cards to see their hints. They're not just there for decoration, you know.
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">The guess:</strong> Type in a name and hit that button. We'll let you know if you're on the right track or completely off base.
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">The dots:</strong> Those little circles? That's your remaining guesses. Watch them disappear as you swing and miss.
                </p>
                <p className="text-sm italic text-slate-500 pt-2">
                  Pro tip: The answer is probably more obvious than you think. Or less. Who knows? Good luck, detective.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      {user && (
        <Dialog open={showAccount} onOpenChange={setShowAccount}>
          <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-8 md:p-10 border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
                My Account
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-4">
                  <div className="flex gap-6 items-start">
                    <div className="flex-1 space-y-4 text-left min-w-0">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 font-body">Name</p>
                        <p className="mt-1 text-slate-900 font-body">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 font-body">Email</p>
                        <p className="mt-1 text-slate-900 font-body">{user.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 w-24 h-24 rounded-full bg-gradient-to-br from-coral/20 to-coral/40 flex items-center justify-center">
                      <span className="text-3xl font-display font-bold text-coral/80">
                        {user.name
                          .split(/\s+/)
                          .map((s) => s[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-6 mt-6 border-t border-slate-200">
                    <Button variant="coral" size="xl" asChild className="w-full">
                      <Link href={logout().url} method="post" as="button">
                        Log out
                      </Link>
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
