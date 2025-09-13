import { Schema, model, models, Types, Model } from "mongoose";

export interface CafeDoc {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  pinHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CafeSchema = new Schema<CafeDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    pinHash: { type: String },
  },
  { timestamps: true, collection: "cafes" }
);

// helpful index (unique slug already covered by field options)
CafeSchema.index({ slug: 1 }, { unique: true });

export default (models.Cafe as Model<CafeDoc>) || model<CafeDoc>("Cafe", CafeSchema, "cafes");