import mongoose from "mongoose";

const printSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        pages: {
            type: Number,
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
        pageByUser: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

const Print = mongoose.model("Print", printSchema);

export default Print;
