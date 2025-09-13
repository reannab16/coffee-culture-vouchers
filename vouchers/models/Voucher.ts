import { Schema, model, models, Types, Model } from "mongoose";

export type VoucherStatus = "active" | "completed" | "void";

export interface VoucherItem {
  _id: Types.ObjectId;
  name: string;
  remaining: number;
}

export interface VoucherDoc {
  _id: Types.ObjectId;
  code: string;
  cafeId: Types.ObjectId;
  guestId: Types.ObjectId;
  offerName: string;
  status: VoucherStatus;
  items: VoucherItem[];
  issuedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const VoucherItemSchema = new Schema<VoucherItem>(
  {
    name: { type: String, required: true },
    remaining: { type: Number, required: true },
  },
  { _id: true }
);

const VoucherSchema = new Schema<VoucherDoc>(
  {
    code: { type: String, required: true, unique: true, index: true },
    cafeId: { type: Schema.Types.ObjectId, ref: "Cafe", required: true, index: true },
    guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true, index: true },
    offerName: { type: String, required: true },
    status: { type: String, enum: ["active", "completed", "void"], default: "active" },
    items: { type: [VoucherItemSchema], default: [] },
    issuedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: "vouchers" }
);

// indexes you’ll actually use
VoucherSchema.index({ code: 1 }, { unique: true });
VoucherSchema.index({ cafeId: 1, guestId: 1, issuedAt: -1 });

export default (models.Voucher as Model<VoucherDoc>) || model<VoucherDoc>("Voucher", VoucherSchema, "vouchers");