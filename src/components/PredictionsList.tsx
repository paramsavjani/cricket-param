"use client"

import { motion } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Coins, Star } from "lucide-react"

interface Prediction {
  id: string
  match: string
  question: string
  selectedOption: string
  date: string
  status: "pending" | "won" | "lost"
  reward?: number
  accuracy?: number
}

interface PredictionsListProps {
  predictions: Prediction[]
  formatDate: (date: string) => string
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  getAccuracyColor: (accuracy: number) => string
}

export function PredictionsList({
  predictions,
  formatDate,
  getStatusColor,
  getStatusText,
  getAccuracyColor,
}: PredictionsListProps) {
  return (
    <ScrollArea className="h-[400px]">
      {predictions.length > 0 ? (
        <div className="divide-y divide-gray-800">
          {predictions.map((prediction) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-white">{prediction.match}</h3>
                  <p className="text-sm text-gray-400">{prediction.question}</p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(prediction.status)} text-white`}>
                  {getStatusText(prediction.status)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{prediction.selectedOption}</Badge>
                  <span className="text-xs text-gray-400">{formatDate(prediction.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {prediction.accuracy && (
                    <span className={`text-xs font-medium ${getAccuracyColor(prediction.accuracy)}`}>
                      {prediction.accuracy}% Confidence
                    </span>
                  )}
                  {prediction.reward && (
                    <div className="flex items-center gap-1 text-green-500">
                      <Coins className="h-3 w-3" />
                      <span className="font-medium">+{prediction.reward} CPT</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <Star className="h-12 w-12 text-gray-600 mb-2" />
          <p className="text-gray-400 text-center">
            You haven't made any predictions yet.
            <br />
            Start predicting to earn rewards!
          </p>
        </div>
      )}
    </ScrollArea>
  )
}

