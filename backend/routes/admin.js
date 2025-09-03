import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Event from '../models/Event.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Slide from '../models/Slide.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', authenticate, adminOnly, async (req, res) => {
  try {
    const [
      totalEvents,
      totalUsers,
      totalTicketsSold,
      totalRevenue,
      recentEvents,
      recentTickets,
      monthlyStats
    ] = await Promise.all([
      // Total events
      Event.countDocuments({ isActive: true }),
      
      // Total users
      User.countDocuments({ isActive: true }),
      
      // Total tickets sold
      Ticket.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]).then(result => result[0]?.total || 0),
      
      // Total revenue
      Ticket.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]).then(result => result[0]?.total || 0),
      
      // Recent events
      Event.find({ isActive: true })
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title date location ticketsSold capacity createdAt'),
      
      // Recent tickets
      Ticket.find({ status: 'paid' })
        .populate('eventId', 'title date')
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('ticketId quantity totalPrice createdAt'),
      
      // Monthly stats for the last 6 months
      Ticket.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalTickets: { $sum: '$quantity' },
            totalRevenue: { $sum: '$totalPrice' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ])
    ]);

    // Category stats
    const categoryStats = await Event.aggregate([
      { $match: { isActive: true, status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top events by tickets sold
    const topEvents = await Event.find({ isActive: true })
      .sort({ ticketsSold: -1 })
      .limit(5)
      .select('title ticketsSold revenue date location.city');

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          totalUsers,
          totalTicketsSold,
          totalRevenue: Math.round(totalRevenue)
        },
        recentEvents,
        recentTickets,
        monthlyStats,
        categoryStats,
        topEvents
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// @route   GET /api/admin/events
// @desc    Get all events for admin
// @access  Private/Admin
router.get('/events', authenticate, adminOnly, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional(),
  query('search').optional()
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      status,
      search
    } = req.query;

    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEvents: total
        }
      }
    });
  } catch (error) {
    console.error('Admin get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin
// @access  Private/Admin
router.get('/users', authenticate, adminOnly, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('role').optional(),
  query('search').optional()
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search
    } = req.query;

    let filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total
        }
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// @route   GET /api/admin/tickets
// @desc    Get all tickets for admin
// @access  Private/Admin
router.get('/tickets', authenticate, adminOnly, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional(),
  query('eventId').optional().isMongoId()
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      eventId
    } = req.query;

    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (eventId) {
      filter.eventId = eventId;
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('eventId', 'title date location')
        .populate('userId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTickets: total
        }
      }
    });
  } catch (error) {
    console.error('Admin get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des billets'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/:id/role', authenticate, adminOnly, [
  body('role').isIn(['user', 'admin', 'agent']).withMessage('Rôle invalide')
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

    const { role } = req.body;
    const userId = req.params.id;

    // Prevent changing own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Rôle utilisateur mis à jour avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du rôle'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/Deactivate user
// @access  Private/Admin
router.put('/users/:id/status', authenticate, adminOnly, [
  body('isActive').isBoolean().withMessage('Statut invalide')
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

    const { isActive } = req.body;
    const userId = req.params.id;

    // Prevent deactivating own account
    if (userId === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: `Compte ${isActive ? 'activé' : 'désactivé'} avec succès`,
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private/Admin
router.get('/analytics', authenticate, adminOnly, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysBack = parseInt(period);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const [
      ticketsSoldTimeline,
      revenueTimeline,
      topEvents,
      categoryPerformance,
      userGrowth
    ] = await Promise.all([
      // Tickets sold timeline
      Ticket.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            tickets: { $sum: '$quantity' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Revenue timeline
      Ticket.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$totalPrice' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Top performing events
      Event.find({ isActive: true })
        .sort({ ticketsSold: -1, revenue: -1 })
        .limit(10)
        .select('title ticketsSold revenue date location.city category'),

      // Category performance
      Event.aggregate([
        {
          $match: {
            isActive: true,
            status: 'published'
          }
        },
        {
          $group: {
            _id: '$category',
            events: { $sum: 1 },
            totalTicketsSold: { $sum: '$ticketsSold' },
            totalRevenue: { $sum: '$revenue' },
            avgPrice: { $avg: '$price' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]),

      // User growth
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period: daysBack,
        ticketsSoldTimeline,
        revenueTimeline,
        topEvents,
        categoryPerformance,
        userGrowth
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analytics'
    });
  }
});

export default router;