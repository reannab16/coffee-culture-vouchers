import { Schema, model, models, Types, Model } from "mongoose";

export interface GuestDoc {
  _id: Types.ObjectId;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const GuestSchema = new Schema<GuestDoc>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  },
  { timestamps: true, collection: "guests" }
);

GuestSchema.index({ email: 1 }, { unique: true });

export default (models.Guest as Model<GuestDoc>) || model<GuestDoc>("Guest", GuestSchema, "guests");