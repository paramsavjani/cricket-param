import { Schema, model, models, Document } from 'mongoose';

interface IBet extends Document {
  question: string;
  user: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BetSchema = new Schema<IBet>(
  {
    question: { type: Schema.Types.String, ref: 'Question', required: true },
    user: { type: Schema.Types.String, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Bet = models.Bet || model<IBet>('Bet', BetSchema);

export default Bet;

export type { IBet };