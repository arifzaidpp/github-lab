import mongoose from "mongoose";

const creditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Credit = mongoose.model("Credit", creditSchema);

export default Credit;
