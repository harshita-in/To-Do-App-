const TaskList = require('../models/TaskList');
const Tasks = require('../models/Task');

// @desc    Get all task lists for user
// @route   GET /api/tasks/lists
// @access  Private
const getLists = async (req, res) => {
  try {
    const lists = await TaskList.find({ user_id: req.user._id }).sort({ list_number: 1 });
    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new task list
// @route   POST /api/tasks/lists
// @access  Private
const createList = async (req, res) => {
  try {
    const { list_name } = req.body;
    if (!list_name) {
      return res.status(400).json({ message: 'List name is required' });
    }

    // Get current lists count / check limit
    const existingLists = await TaskList.find({ user_id: req.user._id });
    if (existingLists.length >= 100) {
      return res.status(400).json({ message: 'Maximum limit of 100 task lists reached' });
    }

    // Find the first available list_number between 1 and 100
    const listNumbers = new Set(existingLists.map(l => l.list_number));
    let newListNumber = -1;
    for (let i = 1; i <= 100; i++) {
      if (!listNumbers.has(i)) {
        newListNumber = i;
        break;
      }
    }

    if (newListNumber === -1) {
      return res.status(400).json({ message: 'Could not allocate list number' });
    }

    // Create the list
    const newList = await TaskList.create({
      user_id: req.user._id,
      list_number: newListNumber,
      list_name: list_name.trim()
    });

    // Initialize blank tasks document for this list
    await Tasks.create({
      user_id: req.user._id,
      list_number: newListNumber,
      task_number: [],
      task_name: [],
      time: [],
      completed: []
    });

    res.status(201).json(newList);
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a task list
// @route   DELETE /api/tasks/lists/:list_number
// @access  Private
const deleteList = async (req, res) => {
  try {
    const listNumber = parseInt(req.params.list_number);

    if (listNumber === 1) {
      return res.status(400).json({ message: 'Cannot delete the default tasks list' });
    }

    // Find and delete the list
    const deletedList = await TaskList.findOneAndDelete({
      user_id: req.user._id,
      list_number: listNumber
    });

    if (!deletedList) {
      return res.status(404).json({ message: 'Task list not found' });
    }

    // Delete tasks document associated with this list
    await Tasks.findOneAndDelete({
      user_id: req.user._id,
      list_number: listNumber
    });

    res.json({ message: 'Task list deleted successfully', list_number: listNumber });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tasks in a list
// @route   GET /api/tasks/:list_number
// @access  Private
const getTasks = async (req, res) => {
  try {
    const listNumber = parseInt(req.params.list_number);
    let tasksDoc = await Tasks.findOne({
      user_id: req.user._id,
      list_number: listNumber
    });

    // Self-healing: if the list exists but no tasks doc exists, create it
    if (!tasksDoc) {
      const listExists = await TaskList.findOne({ user_id: req.user._id, list_number: listNumber });
      if (!listExists) {
        return res.status(404).json({ message: 'Task list not found' });
      }

      tasksDoc = await Tasks.create({
        user_id: req.user._id,
        list_number: listNumber,
        task_number: [],
        task_name: [],
        time: [],
        completed: []
      });
    }

    res.json(tasksDoc);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a task to a list
// @route   POST /api/tasks/:list_number
// @access  Private
const addTask = async (req, res) => {
  try {
    const listNumber = parseInt(req.params.list_number);
    const { task_name, time } = req.body; // time is timestamp integer

    if (!task_name) {
      return res.status(400).json({ message: 'Task name is required' });
    }

    const tasksDoc = await Tasks.findOne({
      user_id: req.user._id,
      list_number: listNumber
    });

    if (!tasksDoc) {
      return res.status(404).json({ message: 'Tasks document not found for this list' });
    }

    // Limit to 999 tasks
    if (tasksDoc.task_name.length >= 999) {
      return res.status(400).json({ message: 'Maximum limit of 999 tasks reached for this list' });
    }

    const nextTaskNumber = tasksDoc.task_name.length + 1;

    // Push new task elements
    tasksDoc.task_number.push(nextTaskNumber);
    tasksDoc.task_name.push(task_name.trim());
    tasksDoc.time.push(time || 0); // 0 means no deadline
    tasksDoc.completed.push(0);    // 0 is pending

    await tasksDoc.save();
    res.status(201).json(tasksDoc);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle task completion status
// @route   PUT /api/tasks/:list_number/toggle
// @access  Private
const toggleTask = async (req, res) => {
  try {
    const listNumber = parseInt(req.params.list_number);
    const { task_number } = req.body;

    const tasksDoc = await Tasks.findOne({
      user_id: req.user._id,
      list_number: listNumber
    });

    if (!tasksDoc) {
      return res.status(404).json({ message: 'Tasks not found' });
    }

    const idx = task_number - 1;
    if (idx < 0 || idx >= tasksDoc.task_number.length) {
      return res.status(400).json({ message: 'Invalid task number' });
    }

    // Toggle: 0 becomes 1, 1 becomes 0
    tasksDoc.completed[idx] = tasksDoc.completed[idx] === 1 ? 0 : 1;

    // Force Mongoose to save array changes
    tasksDoc.markModified('completed');

    await tasksDoc.save();
    res.json(tasksDoc);
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a task & dynamically shift numbers
// @route   DELETE /api/tasks/:list_number/:task_number
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const listNumber = parseInt(req.params.list_number);
    const taskNumber = parseInt(req.params.task_number);

    const tasksDoc = await Tasks.findOne({
      user_id: req.user._id,
      list_number: listNumber
    });

    if (!tasksDoc) {
      return res.status(404).json({ message: 'Tasks not found' });
    }

    const idx = taskNumber - 1;
    if (idx < 0 || idx >= tasksDoc.task_number.length) {
      return res.status(400).json({ message: 'Invalid task number' });
    }

    // Remove element at index
    tasksDoc.task_number.splice(idx, 1);
    tasksDoc.task_name.splice(idx, 1);
    tasksDoc.time.splice(idx, 1);
    tasksDoc.completed.splice(idx, 1);

    // Dynamic auto-updating: update task numbers to match their new indices sequentially
    tasksDoc.task_number = tasksDoc.task_name.map((_, i) => i + 1);

    // Mark modified so mongoose saves the modified arrays
    tasksDoc.markModified('task_number');
    tasksDoc.markModified('task_name');
    tasksDoc.markModified('time');
    tasksDoc.markModified('completed');

    await tasksDoc.save();
    res.json(tasksDoc);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLists,
  createList,
  deleteList,
  getTasks,
  addTask,
  toggleTask,
  deleteTask
};
