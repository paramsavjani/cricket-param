import { Schema, model, models, type Document } from "mongoose";

interface IUser extends Document {
  email: string;
  name?: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
  address: string;
}

export type { IUser };

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    provider: { type: String },
    address: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;
