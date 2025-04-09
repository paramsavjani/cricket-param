import mongoose from "mongoose";

interface IMatch extends mongoose.Document {
  teamA: string;
  teamB: string;
  matchDate: Date;
  createdAt: Date;
  updatedAt: Date;
  merkleRoot: string;
  rewardsCount: number;
}

const MatchSchema = new mongoose.Schema<IMatch>(
  {
    teamA: { type: String, required: true },
    teamB: { type: String, required: true },
    matchDate: { type: Date, required: true },
    merkleRoot: { type: String, required: false },
    rewardsCount: { type: Number, required: false },
  },
  { timestamps: true }
);

const Match =
  mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);

export default Match;

export type { IMatch };
