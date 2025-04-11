
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');

// @desc    Get all PFE topics
// @route   GET /api/topics
// @access  Private
exports.getTopics = async (req, res, next) => {
  try {
    let query = PFETopic.find();

    // Filter by department if specified
    if (req.query.department) {
      query = query.find({ department: req.query.department });
    }

    // Filter by supervisor if specified
    if (req.query.supervisorId) {
      query = query.find({ supervisorId: req.query.supervisorId });
    }

    // Filter by status if specified
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    // Execute query
    const topics = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single PFE topic
// @route   GET /api/topics/:id
// @access  Private
exports.getTopic = async (req, res, next) => {
  try {
    const topic = await PFETopic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new PFE topic
// @route   POST /api/topics
// @access  Private (Admin, Department Head)
exports.createTopic = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if the supervisor exists
    const supervisor = await Teacher.findById(req.body.supervisorId);
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const topic = await PFETopic.create({
      ...req.body,
      supervisorName: `${supervisor.firstName} ${supervisor.lastName}`
    });

    // Update teacher's supervised projects
    await Teacher.findByIdAndUpdate(
      req.body.supervisorId,
      { $push: { supervisedProjects: topic._id } }
    );

    res.status(201).json({
      success: true,
      data: topic
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update PFE topic
// @route   PUT /api/topics/:id
// @access  Private (Admin, Department Head)
exports.updateTopic = async (req, res, next) => {
  try {
    let topic = await PFETopic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    // Check if changing supervisor
    if (req.body.supervisorId && req.body.supervisorId !== topic.supervisorId.toString()) {
      // Get new supervisor info
      const newSupervisor = await Teacher.findById(req.body.supervisorId);
      
      if (!newSupervisor) {
        return res.status(404).json({
          success: false,
          error: 'New supervisor not found'
        });
      }
      
      // Update old supervisor's supervisedProjects array
      await Teacher.findByIdAndUpdate(
        topic.supervisorId,
        { $pull: { supervisedProjects: topic._id } }
      );
      
      // Update new supervisor's supervisedProjects array
      await Teacher.findByIdAndUpdate(
        req.body.supervisorId,
        { $push: { supervisedProjects: topic._id } }
      );
      
      // Update supervisor name in the request body
      req.body.supervisorName = `${newSupervisor.firstName} ${newSupervisor.lastName}`;
    }

    topic = await PFETopic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete PFE topic
// @route   DELETE /api/topics/:id
// @access  Private (Admin, Department Head)
exports.deleteTopic = async (req, res, next) => {
  try {
    const topic = await PFETopic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    // Remove from supervisor's list
    await Teacher.findByIdAndUpdate(
      topic.supervisorId,
      { $pull: { supervisedProjects: topic._id } }
    );

    await topic.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import topics from Excel/JSON
// @route   POST /api/topics/import
// @access  Private (Admin, Department Head)
exports.importTopics = async (req, res, next) => {
  try {
    const { topics } = req.body;
    
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid topics data'
      });
    }
    
    const importedTopics = [];
    const errors = [];
    
    for (let i = 0; i < topics.length; i++) {
      const topicData = topics[i];
      
      try {
        // Find or create supervisor
        let supervisor = await Teacher.findOne({ email: topicData.supervisorEmail });
        
        if (!supervisor) {
          errors.push(`Topic ${i+1}: Supervisor with email ${topicData.supervisorEmail} not found`);
          continue;
        }
        
        const newTopic = await PFETopic.create({
          topicName: topicData.topicName,
          studentName: topicData.studentName,
          studentEmail: topicData.studentEmail,
          supervisorId: supervisor._id,
          supervisorName: `${supervisor.firstName} ${supervisor.lastName}`,
          department: supervisor.department,
          status: 'pending'
        });
        
        // Update teacher's supervised projects
        await Teacher.findByIdAndUpdate(
          supervisor._id,
          { $push: { supervisedProjects: newTopic._id } }
        );
        
        importedTopics.push(newTopic);
      } catch (err) {
        errors.push(`Topic ${i+1}: ${err.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      count: importedTopics.length,
      data: importedTopics,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    next(err);
  }
};
