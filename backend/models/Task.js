const mongoose = require('mongoose');

const tasksSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  list_number: { type: Number, required: true },
  task_number: [{ type: Number }], // Array of task serial numbers (e.g. 1, 2, 3...)
  task_name: [{ type: String }],   // Array of task names/descriptions
  time: [{ type: Number }],        // Array of timestamps (deadlines) or 0 if none
  completed: [{ type: Number }]    // Array of completed statuses (0 = pending, 1 = completed)
}, { 
  timestamps: true 
});

// Ensure a single tasks document per user list
tasksSchema.index({ user_id: 1, list_number: 1 }, { unique: true });

module.exports = mongoose.model('Tasks', tasksSchema);
