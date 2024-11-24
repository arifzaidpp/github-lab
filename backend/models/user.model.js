import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  admissionNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  totalUsage: {
    type: Number,
    default: 0,
  },
  totalUsageFee: {
    type: Number,
    default: 0,
  },
  totalPrint: {
    type: Number,
    default: 0,
  },
  totalPrintFee: {
    type: Number,
    default: 0,
  },
  creditBalance: {
    type: Number,
    default: 0,
  },
  netBalance: {
    type: Number,
    default: 0,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  lastLoginLab: {
    type: String,
    default: null,
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
