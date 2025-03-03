"use client"

import { useState } from "react"
import { MatchCard } from "./MatchCard"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MatchListProps {
  matches: any[]
  onSelectMatch: (match: any) => void
  getTeamLogo: (teamName: string) => string
  formatDate: (date: string) => string
  getTimeRemaining: (date: string) => string
}

export function MatchList({ matches, onSelectMatch, getTeamLogo, formatDate, getTimeRemaining }: MatchListProps) {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  return (
    <div className="relative min-h-[300px]">
      <MatchCard
        match={matches[currentMatchIndex]}
        onSelectMatch={onSelectMatch}
        getTeamLogo={getTeamLogo}
        formatDate={formatDate}
        getTimeRemaining={getTimeRemaining}
      />
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 left-2 transform -translate-y-1/2 rounded-full h-10 w-10 bg-black/80 backdrop-blur-sm"
        onClick={() => setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 right-2 transform -translate-y-1/2 rounded-full h-10 w-10 bg-black/80 backdrop-blur-sm"
        onClick={() => setCurrentMatchIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="flex justify-center mt-4">
        <div className="flex gap-1">
          {matches.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full cursor-pointer ${
                idx === currentMatchIndex ? "bg-primary" : "bg-primary/30"
              }`}
              onClick={() => setCurrentMatchIndex(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

