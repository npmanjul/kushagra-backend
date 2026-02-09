import mongoose, { Schema } from "mongoose";

const ContactSchema = new Schema({
  name: { type: String, required: true },
  phone_number: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Contact", ContactSchema);

