
const express = require('express');
const {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  importTopics
} = require('../controllers/topicController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

const topicValidation = [
  check('topicName', 'Topic name is required').not().isEmpty(),
  check('studentName', 'Student name is required').not().isEmpty(),
  check('supervisorId', 'Supervisor ID is required').not().isEmpty(),
  check('department', 'Department is required').not().isEmpty()
];

router
  .route('/')
  .get(getTopics)
  .post(
    authorize('admin', 'departmentHead'),
    topicValidation,
    createTopic
  );

router
  .route('/:id')
  .get(getTopic)
  .put(
    authorize('admin', 'departmentHead'),
    updateTopic
  )
  .delete(
    authorize('admin', 'departmentHead'),
    deleteTopic
  );

router
  .route('/import')
  .post(
    authorize('admin', 'departmentHead'),
    importTopics
  );

module.exports = router;
