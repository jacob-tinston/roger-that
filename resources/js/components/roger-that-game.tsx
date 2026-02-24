import { Link, router } from "@inertiajs/react"
import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight, ChevronDown, Heart, HeartCrack } from "lucide-react"
import { home, history } from "@/routes"
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
  citations?: string[]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase() || parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function CitationLinks({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null
  return (
    <p className="mt-4 text-slate-400 font-body text-xs flex flex-wrap items-center justify-center gap-1">
      Sources:{" "}
      {urls.map((url, i) => (
        <span key={url}>
          {i > 0 && " · "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2 rounded text-slate-500 hover:text-coral underline underline-offset-2"
          >
            {i + 1}
          </a>
        </span>
      ))}
    </p>
  )
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

interface RecentGameSubject {
  id: number
  name: string
  photo_url: string | null
}

interface RecentGame {
  date: string
  formatted_date: string
  url: string
  is_current: boolean
  subjects: RecentGameSubject[]
}

interface LeaderboardEntry {
  rank: number
  name: string
  attempts: number | null
}

interface PlayedResult {
  success: boolean
  answer: Answer
}

interface RogerThatGameProps {
  subjects: Subject[]
  gameDate: string
  guessUrl: string
  previousGameUrl: string | null
  recentGames: RecentGame[]
  leaderboard: LeaderboardEntry[]
  playedResult?: PlayedResult | null
  nextUnplayedGameUrl?: string | null
  allCaughtUp?: boolean
  settings: GameSettings
  showNotifyCta?: boolean
}

export function RogerThatGame({ subjects, gameDate, guessUrl, previousGameUrl, recentGames, leaderboard, playedResult = null, nextUnplayedGameUrl = null, allCaughtUp = false, settings, showNotifyCta = true }: RogerThatGameProps) {
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
  const [guessing, setGuessing] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [isWrongGuess, setIsWrongGuess] = useState(false)
  const [guessError, setGuessError] = useState<string | null>(null)
  const [howToOpen, setHowToOpen] = useState(false)
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false)
  const [allCaughtUpOpen, setAllCaughtUpOpen] = useState(false)

  useEffect(() => {
    if (SUBTITLES.length > 0) {
      setSubtitle(SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)])
    }
  }, [])

  useEffect(() => {
    if (!playedResult) return
    setGameState(playedResult.success ? "won" : "lost")
    setAnswer(playedResult.answer)
    setMatchedCards(subjects.map((s) => s.id))
    if (playedResult.success && WIN_CAPTIONS.length > 0) {
      setResultCaption(WIN_CAPTIONS[Math.floor(Math.random() * WIN_CAPTIONS.length)])
    }
    if (playedResult.success && WIN_SUB_CAPTIONS.length > 0) {
      setResultSubCaption(WIN_SUB_CAPTIONS[Math.floor(Math.random() * WIN_SUB_CAPTIONS.length)])
    }
    if (!playedResult.success && LOSE_CAPTIONS.length > 0) {
      setResultCaption(LOSE_CAPTIONS[Math.floor(Math.random() * LOSE_CAPTIONS.length)])
    }
    if (!playedResult.success && LOSE_SUB_CAPTIONS.length > 0) {
      setResultSubCaption(LOSE_SUB_CAPTIONS[Math.floor(Math.random() * LOSE_SUB_CAPTIONS.length)])
    }
  }, [playedResult])

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches
    if (isDesktop) setHowToOpen(true)
  }, [])

  const getCsrfToken = (): string =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

  const handleGuess = async () => {
    const guess = currentGuess.trim()
    if (!guess || gameState !== "playing" || guessing) return

    setGuessing(true)
    setGuessError(null)
    try {
      const res = await fetch(guessUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          guess,
          is_last_guess: guessesRemaining === 1,
          game_date: gameDate,
          attempt_number: 6 - guessesRemaining,
        }),
      })
      const data = (await res.json()) as {
        correct?: boolean
        gameOver?: boolean
        answer?: Answer
        error?: string
      }

      if (!res.ok) {
        if (res.status === 419) {
          setGuessError("Your session expired. Please refresh the page and try again.")
        } else {
          setGuessError(data.error ?? "Something went wrong. Please try again.")
        }
        return
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
        router.reload({
          only: [
            "leaderboard",
            "playedResult",
            "nextUnplayedGameUrl",
            "allCaughtUp",
          ],
        })
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
        router.reload({
          only: [
            "leaderboard",
            "playedResult",
            "nextUnplayedGameUrl",
            "allCaughtUp",
          ],
        })
        return
      }

      // Wrong guess - trigger shake and red outline
      setIsWrongGuess(true)
      setGuessesRemaining((g) => Math.max(0, g - 1))
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

  const backUrl = home().url
  const keepGoingUrl = nextUnplayedGameUrl ?? previousGameUrl ?? home().url

  const gameCardClass =
    "bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 transition-all duration-300"
  const asideCardClass =
    "bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-6 md:p-8 transition-all duration-300"

  return (
    <div className="w-full mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start justify-center">
      {/* Left: How to play + Leaderboard — full width on mobile, 1/4 on desktop */}
      <div className="flex flex-col gap-6 w-full lg:w-1/4 lg:max-w-md lg:sticky lg:top-4">
        <aside className={asideCardClass}>
          <button
            type="button"
            onClick={() => setHowToOpen((open) => !open)}
            className="flex items-center justify-between w-full text-left mb-0"
            aria-expanded={howToOpen}
            aria-controls="how-to-play-content"
            id="how-to-play-trigger"
          >
            <h2 className="font-display text-lg font-black text-slate-900 tracking-tight">
              How to Play
            </h2>
            <ChevronDown
              className={cn("w-5 h-5 text-slate-500 shrink-0 ml-2 transition-transform", howToOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          <div
            id="how-to-play-content"
            role="region"
            aria-labelledby="how-to-play-trigger"
            className={cn(
              "space-y-4 text-slate-600 font-body text-sm mt-4",
              !howToOpen && "hidden"
            )}
          >
            <p>
              <strong className="text-slate-900 font-semibold font-body">Meet the Ladies:</strong> You'll be shown four different women with one thing in common: Someone's kept them busy.
            </p>
            <p>
              <strong className="text-slate-900 font-semibold font-body">Spot the Culprit:</strong> Your job is to figure out which bloke has Rogered all four.
            </p>
            <p>
              <strong className="text-slate-900 font-semibold font-body">Take your Shot:</strong> You get five guesses. Hover over each bombshell for more info.
            </p>
            <p>
              <strong className="text-slate-900 font-semibold font-body">Nail It or Walk Away:</strong> Guess right and enjoy the bragging rights. Guess wrong and watch the rogue slip away… until tomorrow.
            </p>
            <p className="text-xs italic text-slate-500 pt-2">
              Disclaimer: This game includes AI generated content and is not intended to be factual, defamatory, or make any claims about the actual personal lives (or bedrooms) of any celebrities.
            </p>
          </div>
        </aside>

        <aside className={asideCardClass}>
          <h2 className="font-display text-lg font-black text-slate-900 tracking-tight mb-3">
            Top Sh*ggers
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-slate-500 font-body text-sm">No scores yet. Be the first!</p>
          ) : (
            <>
              <ul className="space-y-2">
                {leaderboard.map((entry) => (
                  <li
                    key={`${entry.rank}-${entry.name}-${entry.attempts ?? "p"}`}
                    className={cn(
                      "flex items-center gap-2 py-2 px-3 rounded-lg border transition-all",
                      "border-slate-200 hover:border-coral hover:shadow-sm"
                    )}
                  >
                    <span className="font-display font-bold text-slate-400 text-sm tabular-nums shrink-0">
                      {entry.rank}
                    </span>
                    <span
                      className={cn(
                        "font-display font-semibold text-slate-900 text-sm flex-1 min-w-0 truncate",
                        showNotifyCta && "blur-sm select-none"
                      )}
                    >
                      {entry.name}
                    </span>
                    <span
                      className={cn(
                        "font-body text-slate-500 text-xs shrink-0",
                        showNotifyCta && "blur-sm select-none"
                      )}
                    >
                      {entry.attempts != null
                        ? `${entry.attempts} ${entry.attempts === 1 ? "guess" : "guesses"}`
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              {showNotifyCta && (
                <Button
                  variant="secondary"
                  className="w-full mt-4"
                  onClick={() => setJoinModalOpen(true)}
                >
                  Join the Top Sh*ggers
                </Button>
              )}
            </>
          )}
        </aside>
      </div>

      {/* Center: Game card — full width on mobile, 1/2 on desktop */}
      <div className="w-full lg:w-1/2 lg:max-w-lg">
        <div
          className={cn(
            "relative overflow-hidden hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1",
            gameCardClass,
            getGameCardOutline(),
            isWrongGuess && gameState === "playing" && "animate-shake"
          )}
        >
          {/* Back button */}
          <Link
            href={backUrl}
            className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Account Icon */}
          <AccountButton
            signUpOpen={joinModalOpen}
            onSignUpOpenChange={setJoinModalOpen}
          />

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
                onChange={(v) => { setCurrentGuess(v); setGuessError(null) }}
                onSubmit={handleGuess}
                buttonText={getButtonText()}
                guessesRemaining={guessesRemaining}
                disabled={guessing}
              />

              {guessError && (
                <p className="text-center mt-2 text-red-600 font-body text-sm" role="alert">
                  {guessError}
                </p>
              )}

              {/* Reaction */}
              {reaction && (
                <p className="text-center mt-4 text-slate-600 font-body text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {reaction}
                </p>
              )}

              {/* Guesses Remaining */}
              <div className="mt-6 flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) =>
                  i < guessesRemaining ? (
                    <Heart
                      key={i}
                      className="w-4 h-4 text-coral fill-coral shrink-0 transition-all duration-300"
                      aria-hidden
                    />
                  ) : (
                    <HeartCrack
                      key={i}
                      className="w-4 h-4 text-slate-300 shrink-0 transition-all duration-300"
                      aria-hidden
                    />
                  )
                )}
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
              <div className="mt-8">
                {allCaughtUp ? (
                  <Button variant="coral" onClick={() => setAllCaughtUpOpen(true)}>
                    Keep the action going
                  </Button>
                ) : (
                  <Button variant="coral" asChild>
                    <Link href={keepGoingUrl}>Keep the action going</Link>
                  </Button>
                )}
              </div>
              {answer?.citations && <CitationLinks urls={answer.citations} />}
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
              <div className="mt-8">
                {allCaughtUp ? (
                  <Button variant="coral" onClick={() => setAllCaughtUpOpen(true)}>
                    Keep the action going
                  </Button>
                ) : (
                  <Button variant="coral" asChild>
                    <Link href={keepGoingUrl}>Keep the action going</Link>
                  </Button>
                )}
              </div>
              {answer?.citations && <CitationLinks urls={answer.citations} />}
            </div>
          )}
        </div>
      </div>

      {/* Right: Past games + Notify CTA — full width on mobile, 1/4 on desktop; third in column order */}
      <div className="flex flex-col gap-6 w-full lg:w-1/4 lg:max-w-md lg:sticky lg:top-4">
        <aside className={asideCardClass}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-lg font-black text-slate-900 tracking-tight">
              Past games
            </h2>
            <Link
              href={history().url}
              className="inline-flex items-center gap-1.5 font-display font-semibold text-sm text-coral hover:text-coral/80 transition-colors shrink-0 [&_svg]:text-coral [&_svg]:shrink-0"
            >
              View all
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-2">
            {recentGames.map((g) => (
              <li key={g.date}>
                <Link
                  href={g.url}
                  className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg border transition-all",
                    g.is_current
                      ? "border-coral bg-coral/5 shadow-sm"
                      : "border-slate-200 hover:border-coral hover:shadow-sm"
                  )}
                >
                  <span className="font-display font-semibold text-slate-900 text-sm flex-1 min-w-0 truncate">
                    {g.formatted_date}
                  </span>
                  <div className="flex gap-1.5 shrink-0 ml-auto">
                    {(g.subjects ?? []).slice(0, 4).map((subject) => (
                      <div
                        key={subject.id}
                        className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0"
                      >
                        {subject.photo_url ? (
                          <img
                            src={subject.photo_url}
                            alt=""
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-600 font-display leading-none">
                              {getInitials(subject.name)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {showNotifyCta ? (
          <aside className={asideCardClass}>
            <p className="font-display font-black text-slate-900 text-lg tracking-tight mb-2">
              Don’t miss the next rogering
            </p>
            <p className="text-slate-600 font-body text-sm mb-4">
              Get notified when the new game drops so you never miss a scandal.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setJoinModalOpen(true)}
            >
              Notify me
            </Button>
          </aside>
        ) : (
          <aside className={asideCardClass}>
            <p className="font-display font-black text-slate-900 text-lg tracking-tight mb-2">
              Invite your friends
            </p>
            <p className="text-slate-600 font-body text-sm mb-4">
              Share the chaos. Send your mates the link and see who's got the best tabloid instincts.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href)
                  setInviteLinkCopied(true)
                  setTimeout(() => setInviteLinkCopied(false), 2000)
                } catch {
                  setInviteLinkCopied(false)
                }
              }}
            >
              {inviteLinkCopied ? "Copied!" : "Copy link"}
            </Button>
            {inviteLinkCopied && (
              <p className="mt-2 text-coral font-body text-sm font-medium" role="status">
                Link copied to clipboard
              </p>
            )}
          </aside>
        )}
      </div>

      <Dialog open={allCaughtUpOpen} onOpenChange={setAllCaughtUpOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-8 md:p-10 border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
              You're all caught up
            </DialogTitle>
            <DialogDescription asChild>
              <div className="mt-4 text-center space-y-6">
                <p className="text-slate-600 font-body text-sm md:text-base leading-relaxed">
                  You've played every game so far. Come back tomorrow for the next scandal.
                </p>
                <Button variant="coral" asChild className="w-full">
                  <Link href={home().url}>Back to home</Link>
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
