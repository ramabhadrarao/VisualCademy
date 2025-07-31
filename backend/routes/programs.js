const express = require('express');
const Program = require('../models/Program');
const { auth, approvedUserAuth } = require('../middleware/auth');
const aiService = require('../services/aiService');
const axios = require('axios');

const router = express.Router();

// Apply auth middleware
router.use(auth);
router.use(approvedUserAuth);

// Create new program
router.post('/create', async (req, res) => {
  try {
    const { title, description, code, tags } = req.body;
    
    if (!title || !code) {
      return res.status(400).json({ 
        message: 'Title and code are required fields' 
      });
    }
    
    const program = new Program({
      userId: req.user._id,
      title,
      description: description || '',
      code,
      tags: tags || []
    });

    await program.save();
    
    res.status(201).json({
      message: 'Program created successfully',
      program
    });
  } catch (error) {
    console.error('Create program error:', error);
    res.status(500).json({ message: 'Failed to create program' });
  }
});

// Get user's programs
router.get('/my-programs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const programs = await Program.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-aiConversations -notes');

    const total = await Program.countDocuments({ userId: req.user._id });

    res.json({
      programs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
});

// Get single program
router.get('/:programId', async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.programId,
      userId: req.user._id
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json({ program });
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ message: 'Failed to fetch program' });
  }
});

// Update program
router.put('/:programId', async (req, res) => {
  try {
    const { title, description, code, tags } = req.body;
    
    const program = await Program.findOneAndUpdate(
      { _id: req.params.programId, userId: req.user._id },
      { title, description, code, tags, updatedAt: Date.now() },
      { new: true }
    );

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json({ message: 'Program updated', program });
  } catch (error) {
    console.error('Update program error:', error);
    res.status(500).json({ message: 'Failed to update program' });
  }
});

// Delete program
router.delete('/:programId', async (req, res) => {
  try {
    const program = await Program.findOneAndDelete({
      _id: req.params.programId,
      userId: req.user._id
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ message: 'Failed to delete program' });
  }
});

// Execute program
router.post('/:programId/execute', async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.programId,
      userId: req.user._id
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const CODE_EXECUTION_API = process.env.CODE_EXECUTION_API_URL || 'http://43.250.40.133:3000';
    const response = await axios.post(`${CODE_EXECUTION_API}/api/v1/execute`, {
      code: program.code,
      language: program.programmingLanguage || 'c',
      timeout: 10000
    });

    const result = response.data;

    // Update statistics
    program.statistics.totalRuns += 1;
    if (result.exitCode === 0) {
      program.statistics.successfulRuns += 1;
    } else {
      program.statistics.failedRuns += 1;
    }

    const totalTime = program.statistics.averageExecutionTime * (program.statistics.totalRuns - 1) + result.executionTime;
    program.statistics.averageExecutionTime = totalTime / program.statistics.totalRuns;

    program.lastExecutionResult = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTime: result.executionTime,
      timestamp: new Date()
    };

    await program.save();

    res.json({ result, statistics: program.statistics });
  } catch (error) {
    console.error('Execute program error:', error);
    res.status(500).json({ message: 'Failed to execute program' });
  }
});

// AI: Ask question (with streaming support)
router.post('/:programId/ai/ask', async (req, res) => {
  try {
    const { question, stream = false } = req.body;
    
    console.log(`AI Ask: ${question} (stream: ${stream})`);
    
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }
    
    const program = await Program.findOne({
      _id: req.params.programId,
      userId: req.user._id
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const context = `The user is asking about this C program:\n\n${program.code}\n\n`;

    // Always use normal response for now (streaming requires WebSocket or different auth)
    const response = await aiService.generateResponse(question, context);
    
    // Save conversation
    program.aiConversations.push(
      { role: 'user', content: question },
      { role: 'assistant', content: response }
    );
    
    if (program.aiConversations.length > 50) {
      program.aiConversations = program.aiConversations.slice(-50);
    }
    
    await program.save();
    
    res.json({ response });
  } catch (error) {
    console.error('AI ask error:', error);
    res.status(500).json({ 
      message: 'Failed to get AI response',
      error: error.message
    });
  }
});

// Generate test cases
router.post('/:programId/ai/generate-tests', async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.programId,
      userId: req.user._id
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const testCases = await aiService.generateTestCases(program.code);
    
    program.testCases = testCases;
    await program.save();

    res.json({ testCases });
  } catch (error) {
    console.error('Generate tests error:', error);
    res.status(500).json({ message: 'Failed to generate test cases' });
  }
});

// Run test cases
router.post('/:programId/run-tests', async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.programId,
      userId: req.user._id
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const CODE_EXECUTION_API = process.env.CODE_EXECUTION_API_URL || 'http://43.250.40.133:3000';
    const results = [];

    for (const testCase of program.testCases) {
      try {
        const response = await axios.post(`${CODE_EXECUTION_API}/api/v1/execute`, {
          code: program.code,
          language: program.programmingLanguage || 'c',
          input: testCase.input,
          timeout: 5000
        });

        const passed = response.data.stdout.trim() === testCase.expectedOutput.trim() && 
                      response.data.exitCode === 0;

        results.push({
          ...testCase.toObject(),
          actualOutput: response.data.stdout,
          passed,
          executionTime: response.data.executionTime
        });

        testCase.passed = passed;
      } catch (error) {
        results.push({
          ...testCase.toObject(),
          passed: false,
          error: error.message
        });
      }
    }

    await program.save();

    res.json({ results });
  } catch (error) {
    console.error('Run tests error:', error);
    res.status(500).json({ message: 'Failed to run tests' });
  }
});

// Get improvements
router.post('/:programId/ai/improvements', async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.programId,
      userId: req.user._id
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const improvements = await aiService.suggestImprovements(program.code);
    res.json({ improvements });
  } catch (error) {
    console.error('Get improvements error:', error);
    res.status(500).json({ message: 'Failed to get improvements' });
  }
});

// Test endpoints
router.get('/test-ollama', async (req, res) => {
  try {
    const response = await axios.get('http://127.0.0.1:11434/api/tags', {
      timeout: 5000
    });
    res.json({ 
      status: 'connected', 
      models: response.data.models?.map(m => m.name) || []
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'disconnected', 
      error: error.message 
    });
  }
});

module.exports = router;