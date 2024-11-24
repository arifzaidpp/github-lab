import mongoose from 'mongoose';

const purposeSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    }
  }, { timestamps: true });

const Purpose = mongoose.model('Purpose', purposeSchema);

export default Purpose;