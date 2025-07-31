const express = require('express');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminAuth);

// Get all pending users
router.get('/pending-users', async (req, res) => {
  try {
    const pendingUsers = await User.find({
      isApproved: false,
      role: 'student'
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      message: 'Pending users retrieved successfully',
      users: pendingUsers
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin dashboard)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve user
router.post('/approve-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: 'User is already approved' });
    }

    user.isApproved = true;
    await user.save();

    res.json({
      message: 'User approved successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject/Delete user
router.delete('/reject-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot reject admin users' });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User rejected and removed successfully',
      userId
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const approvedUsers = await User.countDocuments({ isApproved: true });
    const pendingUsers = await User.countDocuments({ isApproved: false, role: 'student' });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 6
      }
    ]);

    res.json({
      message: 'Statistics retrieved successfully',
      stats: {
        totalUsers,
        approvedUsers,
        pendingUsers,
        adminUsers,
        recentUsers,
        usersByMonth
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;