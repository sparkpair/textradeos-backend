import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    phone_no: { type: String, required: true, unique: true, trim: true },
    registration_date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ["monthly", "yearly"], required: true },
    price: { type: Number, required: true, min: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Business = mongoose.model("Business", businessSchema);
export default Business;
