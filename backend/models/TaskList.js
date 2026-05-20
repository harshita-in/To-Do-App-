const mongoose = require('mongoose');

const taskListSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  list_number: { 
    type: Number, 
    required: true,
    min: [1, 'List number must be between 1 and 100'],
    max: [100, 'List number must be between 1 and 100']
  },
  list_name: { type: String, required: true, trim: true }
}, { 
  timestamps: true 
});

// Compound unique index so a user cannot have two lists with the same list_number
taskListSchema.index({ user_id: 1, list_number: 1 }, { unique: true });

module.exports = mongoose.model('TaskList', taskListSchema);
