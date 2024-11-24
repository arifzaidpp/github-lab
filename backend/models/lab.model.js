import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
    computerId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    }
  }, { timestamps: true });

const Lab = mongoose.model('Lab', labSchema);

export default Lab;