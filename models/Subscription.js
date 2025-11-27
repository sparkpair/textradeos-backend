import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    type: { type: String, enum: ["monthly", "yearly"], required: true },
    price: { type: Number, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    paymentStatus: { type: String, enum: ["paid", "unpaid", "pending"], default: "unpaid" },
    paymentDate: { type: Date },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
