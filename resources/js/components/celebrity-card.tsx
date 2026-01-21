import { useState } from "react"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase() || parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

interface CelebrityCardProps {
  name: string
  year: number
  hint: string
  photoUrl?: string | null
  isMatched: boolean
  isLocked: boolean
}

export function CelebrityCard({ name, year, hint, photoUrl, isMatched, isLocked }: CelebrityCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const showPhoto = Boolean(photoUrl) && !imgFailed
  const initials = getInitials(name)

  return (
    <div
      className={cn("relative aspect-square cursor-pointer group", "[perspective:1000px]")}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onFocus={() => setIsFlipped(true)}
      onBlur={() => setIsFlipped(false)}
      tabIndex={0}
      role="button"
      aria-label={`Celebrity card: ${name}`}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
          isFlipped && "[transform:rotateY(180deg)]",
          "motion-reduce:transition-none motion-reduce:[transform:none]",
        )}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-slate-100 to-slate-200",
            "shadow-md hover:shadow-lg transition-shadow duration-300",
            isMatched && "ring-2 ring-emerald-400 ring-offset-2",
            isLocked && "opacity-50 saturate-50",
          )}
        >
          {/* Thumbnail or initials */}
          {showPhoto ? (
            <img
              src={photoUrl!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral/20 to-coral/40 flex items-center justify-center">
                <span className="text-3xl font-display font-bold text-coral/60">{initials}</span>
              </div>
            </div>
          )}

          {/* Grain overlay */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Hover hint */}
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-body">
              Hover me
            </span>
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl",
            "bg-white border-2 border-slate-100",
            "shadow-lg p-4 flex flex-col items-center justify-center text-center",
            "motion-reduce:hidden",
          )}
        >
          <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{name}</h3>
          <p className="text-slate-400 text-sm mt-1 font-body">Born {year}</p>
          <p className="text-coral text-xs mt-2 italic font-body">{hint}</p>
        </div>
      </div>
    </div>
  )
}
