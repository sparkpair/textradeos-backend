import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    person_name: { type: String, required: true, trim: true },
    phone_no: { type: String, required: true, unique: true, trim: true },
    address: { type: String, },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
