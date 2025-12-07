import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema(
  {
    manager_approval: {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      status: { type: Boolean, default: false },
      date: { type: Date },
    },
    supervisor_approval: {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      status: { type: Boolean, default: false },
      date: { type: Date },
    },
    admin_approval: {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      status: { type: Boolean, default: false },
      date: { type: Date },
    },
  },
  { timestamps: true }
);

const Approval = mongoose.model("Approval", approvalSchema);

export default Approval;
