import express from 'express';
import { body, validationResult, query } from 'express-validator';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Multer configuration for avatar upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile with stats
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get user stats
    const [ticketStats, recentTickets] = await Promise.all([
      Ticket.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$totalPrice' }
          }
        }
      ]),
      Ticket.find({ userId: req.user._id })
        .populate('eventId', 'title date location images')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Process stats
    const stats = {
      totalTickets: 0,
      paidTickets: 0,
      totalSpent: 0,
      upcomingEvents: 0
    };

    ticketStats.forEach(stat => {
      stats.totalTickets += stat.count;
      if (stat._id === 'paid') {
        stats.paidTickets = stat.count;
        stats.totalSpent = stat.total;
      }
    });

    // Count upcoming events
    stats.upcomingEvents = recentTickets.filter(ticket => 
      ticket.status === 'paid' && 
      ticket.eventId && 
      new Date(ticket.eventId.date) > new Date()
    ).length;

    res.json({
      success: true,
      data: {
        user,
        stats,
        recentTickets
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, upload.single('avatar'), [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^(\+221|00221)?[7][0-9]{8}$/),
  body('address.street').optional().trim().isLength({ max: 200 }),
  body('address.city').optional().trim().isLength({ max: 100 }),
  body('address.region').optional().trim().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'preferences'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle address as nested object
    if (req.body.address) {
      updateData.address = JSON.parse(req.body.address);
    }

    // Handle preferences as nested object
    if (req.body.preferences) {
      updateData.preferences = JSON.parse(req.body.preferences);
    }

    // Handle avatar upload
    if (req.file) {
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// @route   GET /api/users/tickets
// @desc    Get user tickets with detailed info
// @access  Private
router.get('/tickets', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional(),
  query('upcoming').optional().isBoolean()
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      upcoming
    } = req.query;

    let filter = { userId: req.user._id };
    
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    let ticketsQuery = Ticket.find(filter)
      .populate({
        path: 'eventId',
        select: 'title date location images category organizer status'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [tickets, total] = await Promise.all([
      ticketsQuery,
      Ticket.countDocuments(filter)
    ]);

    // Filter upcoming events if requested
    let filteredTickets = tickets;
    if (upcoming === 'true') {
      filteredTickets = tickets.filter(ticket => 
        ticket.eventId && new Date(ticket.eventId.date) > new Date()
      );
    }

    res.json({
      success: true,
      data: {
        tickets: filteredTickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTickets: total
        }
      }
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des billets'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const [
      ticketStats,
      upcomingEvents,
      recentActivity,
      favoriteCategories
    ] = await Promise.all([
      // Ticket statistics
      Ticket.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$totalPrice' }
          }
        }
      ]),

      // Upcoming events
      Ticket.find({
        userId: req.user._id,
        status: 'paid'
      })
      .populate({
        path: 'eventId',
        match: { date: { $gt: new Date() } },
        select: 'title date location images'
      })
      .limit(5),

      // Recent activity
      Ticket.find({ userId: req.user._id })
        .populate('eventId', 'title date location')
        .sort({ createdAt: -1 })
        .limit(10),

      // Favorite categories (based on purchase history)
      Ticket.aggregate([
        { $match: { userId: req.user._id, status: 'paid' } },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $group: {
            _id: '$event.category',
            count: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    // Process statistics
    const stats = {
      totalTickets: 0,
      paidTickets: 0,
      pendingTickets: 0,
      totalSpent: 0
    };

    ticketStats.forEach(stat => {
      stats.totalTickets += stat.count;
      if (stat._id === 'paid') {
        stats.paidTickets = stat.count;
        stats.totalSpent = stat.total;
      } else if (stat._id === 'pending') {
        stats.pendingTickets = stat.count;
      }
    });

    // Filter upcoming events (remove null eventId)
    const filteredUpcomingEvents = upcomingEvents.filter(ticket => ticket.eventId);

    res.json({
      success: true,
      data: {
        stats,
        upcomingEvents: filteredUpcomingEvents,
        recentActivity,
        favoriteCategories
      }
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord'
    });
  }
});

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', authenticate, [
  body('password').notEmpty().withMessage('Mot de passe requis pour supprimer le compte')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis',
        errors: errors.array()
      });
    }

    const { password } = req.body;
    const user = await User.findById(req.user._id);

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Check for active tickets
    const activeTickets = await Ticket.countDocuments({
      userId: req.user._id,
      status: 'paid',
      'qrCode.scanned': false
    });

    if (activeTickets > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer le compte: ${activeTickets} billet(s) actif(s). Utilisez d'abord vos billets ou contactez le support.`
      });
    }

    // Soft delete - deactivate account instead of hard delete
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.json({
      success: true,
      message: 'Compte désactivé avec succès'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du compte'
    });
  }
});

export default router;