const mongoose = require('mongoose');

// Counter schema to handle auto-incrementing integer user_id
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const userSchema = new mongoose.Schema({
  _id: { type: Number }, // user_id
  user_email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Simple regex to check for '@' and '.'
        return v.includes('@') && v.split('@')[1]?.includes('.');
      },
      message: props => `${props.value} is not a valid email! Must contain '@' and '.'`
    }
  },
  user_password: { type: String, required: true },
  user_name: { type: String, required: true, unique: true, trim: true }
}, { 
  _id: false,
  timestamps: true 
});

userSchema.pre('save', async function() {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'user_id' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this._id = counter.seq;
  }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Counter
};
