import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: [pollOptionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  endsAt: {
    type: Date,
  },
}, { timestamps: true });

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;
