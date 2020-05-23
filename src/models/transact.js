const mongoose = require('mongoose');
const validator = require('validator');
const transactSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true },
    description: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 1,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      default: 'exp',
      required: true,
      maxlength: 3,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Users',
    },
  },
  { timestamps: true }
);

const Transact = mongoose.model('Tasks', taskSchema);

module.exports = Tasks;
