"use client"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"

interface MatchCardProps {
  match: {
    _id: string
    teamA: string
    teamB: string
    matchDate: string
  }
  onSelectMatch: (match: any) => void
  getTeamLogo: (teamName: string) => string
  formatDate: (date: string) => string
  getTimeRemaining: (date: string) => string
}

export function MatchCard({ match, onSelectMatch, getTeamLogo, formatDate, getTimeRemaining }: MatchCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden border-primary/20 hover:border-primary/50 transition-colors duration-300 bg-gray-900">
        <CardHeader className="pb-2 bg-primary/5">
          <CardTitle className="text-base flex items-center justify-between text-white">
            <span>
              {match.teamA} vs {match.teamB}
            </span>
            <Badge variant="outline" className="ml-2">
              {getTimeRemaining(match.matchDate)}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Calendar className="h-3 w-3" />
            {formatDate(match.matchDate)}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src={getTeamLogo(match.teamA) || "/placeholder.svg"}
                alt={match.teamA}
                className="h-12 w-12 object-contain"
              />
              <span className="text-lg font-bold text-white">{match.teamA}</span>
            </div>
            <span className="text-xl font-bold text-white">vs</span>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-white">{match.teamB}</span>
              <img
                src={getTeamLogo(match.teamB) || "/placeholder.svg"}
                alt={match.teamB}
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-primary/5 py-3 px-6">
          <Button variant="ghost" className="w-full text-white hover:text-primary" onClick={() => onSelectMatch(match)}>
            View Details & Predict
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

