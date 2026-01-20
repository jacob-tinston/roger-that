import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const PLACEHOLDERS = ["Type a name…", "Who's your suspect?", "Go on, take a punt", "Name names…", "Any guesses?"]

interface GuessInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  buttonText: string
  guessesRemaining: number
}

export function GuessInput({ value, onChange, onSubmit, buttonText, guessesRemaining }: GuessInputProps) {
  const [placeholder, setPlaceholder] = useState("")

  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-3 rounded-xl",
          "bg-slate-50 border-2 border-slate-100",
          "text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20",
          "transition-all duration-200 font-body",
        )}
        aria-label="Enter your guess"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className={cn(
          "w-full px-6 py-3 rounded-xl font-display font-bold text-white",
          "bg-coral hover:bg-coral/90",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2",
          guessesRemaining === 1 && "animate-pulse",
        )}
      >
        {buttonText}
      </button>
    </form>
  )
}
