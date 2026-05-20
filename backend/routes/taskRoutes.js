const express = require('express');
const router = express.Router();
const {
  getLists,
  createList,
  deleteList,
  getTasks,
  addTask,
  toggleTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All task routes require authentication
router.use(protect);

router.route('/lists')
  .get(getLists)
  .post(createList);

router.route('/lists/:list_number')
  .delete(deleteList);

router.route('/:list_number')
  .get(getTasks)
  .post(addTask);

router.route('/:list_number/toggle')
  .put(toggleTask);

router.route('/:list_number/:task_number')
  .delete(deleteTask);

module.exports = router;
