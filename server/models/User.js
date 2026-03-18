import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['staff', 'secretariat', 'case_manager', 'admin'],
    default: 'staff',
  },
  department: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  refreshTokens: [
    {
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now, expires: '7d' },
    },
  ],
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;

