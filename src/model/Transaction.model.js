import mongoose from "mongoose";
const { Schema } = mongoose;

const TransactionType = ["sell", "deposit", "withdraw", "loan"]; 

const transactionHistorySchema = new Schema({
  transaction_type: {
    type: String,
    enum: TransactionType,
    required: true,
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },

  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouses",
  },

  grain: [
    {
      category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GrainCategories",
        required: true,
      },
      quantity_quintal: { type: Number, required: true },
      price_per_quintal: { type: Number, required: true },
    },
  ],
  month: {
    type: Number,
    required: function () {
      return this.transaction_type === "loan";
    },
  },

  total_amount: { type: Number, required: true },
  remarks: { type: String },
  transaction_date: { type: Date, default: Date.now },
});

export default mongoose.model("TransactionHistory", transactionHistorySchema);
