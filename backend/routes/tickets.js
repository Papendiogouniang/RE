import express from 'express';
import { body, validationResult } from 'express-validator';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authenticate, agentOrAdmin } from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import QRCode from 'qrcode';

const router = express.Router();

// @route   GET /api/tickets
// @desc    Get user's tickets
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('eventId', 'title date location images category')
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
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des billets'
    });
  }
});

// @route   GET /api/tickets/:ticketId
// @desc    Get single ticket details
// @access  Private
router.get('/:ticketId', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId
    })
    .populate('eventId', 'title date location images category organizer')
    .populate('userId', 'firstName lastName email phone');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }

    // Check if user owns the ticket or is admin/agent
    if (ticket.userId._id.toString() !== req.user._id.toString() && 
        !['admin', 'agent'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du billet'
    });
  }
});

// @route   POST /api/tickets/verify/:ticketId
// @desc    Verify ticket for entry (Agent/Admin only)
// @access  Private/Agent/Admin
router.post('/verify/:ticketId', authenticate, agentOrAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId
    })
    .populate('eventId', 'title date location')
    .populate('userId', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé',
        validationResult: {
          isValid: false,
          status: 'not_found',
          message: 'Billet non trouvé'
        }
      });
    }

    // Check if ticket is valid
    const validationInfo = ticket.getValidationInfo();

    if (!validationInfo.isValid) {
      return res.status(400).json({
        success: false,
        message: validationInfo.isScanned ? 'Billet déjà utilisé' : 'Billet invalide',
        validationResult: {
          isValid: false,
          status: ticket.status,
          isScanned: ticket.qrCode.scanned,
          scannedAt: ticket.qrCode.scannedAt,
          ticketId: ticket.ticketId,
          holderName: ticket.holderFullName || ticket.userId.fullName,
          eventTitle: ticket.eventId.title,
          eventDate: ticket.eventId.date,
          message: validationInfo.isScanned ? 'Billet déjà utilisé' : 'Billet invalide'
        }
      });
    }

    // Check if event is today (optional validation)
    const eventDate = new Date(ticket.eventId.date);
    const today = new Date();
    const isEventToday = eventDate.toDateString() === today.toDateString();

    if (!isEventToday) {
      // Warning but don't block (maybe early entry is allowed)
      console.log(`⚠️ Billet scanné pour événement non prévu aujourd'hui: ${ticket.eventId.title}`);
    }

    // Mark as scanned
    await ticket.markAsScanned(req.user._id);

    // Update event stats
    await Event.findByIdAndUpdate(ticket.eventId._id, {
      $inc: { ticketsUsed: 1 }
    });

    res.json({
      success: true,
      message: 'Billet validé avec succès - Entrée autorisée',
      validationResult: {
        isValid: true,
        status: 'used',
        isScanned: true,
        scannedAt: new Date(),
        scannedBy: req.user.fullName,
        ticketId: ticket.ticketId,
        holderName: ticket.holderFullName || ticket.userId.fullName,
        eventTitle: ticket.eventId.title,
        eventDate: ticket.eventId.date,
        eventLocation: ticket.eventId.location.name,
        message: 'Entrée autorisée ✅'
      }
    });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du billet',
      validationResult: {
        isValid: false,
        status: 'error',
        message: 'Erreur système'
      }
    });
  }
});

// @route   GET /api/tickets/verify-qr/:ticketId
// @desc    Verify ticket via QR code (public for scanner)
// @access  Private/Admin
router.get('/verify-qr/:ticketId', authenticate, async (req, res) => {
  try {
    // Only admin can verify tickets
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent vérifier les billets'
      });
    }

    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId
    })
    .populate('eventId', 'title date location')
    .populate('userId', 'firstName lastName');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé',
        isValid: false
      });
    }

    const validationInfo = ticket.getValidationInfo();

    // If ticket is valid and not scanned, mark as scanned
    if (validationInfo.isValid && !ticket.qrCode.scanned) {
      await ticket.markAsScanned(req.user._id);
      
      // Update event stats
      await Event.findByIdAndUpdate(ticket.eventId._id, {
        $inc: { ticketsUsed: 1 }
      });
    }

    res.json({
      success: true,
      validationResult: {
        isValid: validationInfo.isValid,
        status: ticket.status,
        isScanned: ticket.qrCode.scanned,
        scannedAt: ticket.qrCode.scannedAt,
        scannedBy: req.user.fullName,
        ticketId: ticket.ticketId,
        holderName: ticket.holderFullName || ticket.userId.fullName,
        eventTitle: ticket.eventId.title,
        eventDate: ticket.eventId.date,
        eventLocation: ticket.eventId.location.name,
        message: validationInfo.isValid ? 'Billet valide - Entrée autorisée' : 'Billet invalide'
      },
      data: {
        isValid: validationInfo.isValid,
        status: ticket.status,
        isScanned: ticket.qrCode.scanned,
        scannedAt: ticket.qrCode.scannedAt,
        ticketId: ticket.ticketId,
        holderName: ticket.holderFullName || ticket.userId.fullName,
        eventTitle: ticket.eventId.title,
        eventDate: ticket.eventId.date,
        eventLocation: ticket.eventId.location.name,
        quantity: ticket.quantity
      }
    });
  } catch (error) {
    console.error('Verify QR ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du billet',
      isValid: false
    });
  }
});

// @route   POST /api/tickets/:ticketId/resend-email
// @desc    Resend ticket email
// @access  Private
router.post('/:ticketId/resend-email', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId,
      userId: req.user._id
    })
    .populate('eventId')
    .populate('userId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }

    if (ticket.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Le billet doit être payé pour renvoyer l\'email'
      });
    }

    await emailService.sendTicketEmail(ticket.userId, ticket, ticket.eventId);

    res.json({
      success: true,
      message: 'Email renvoyé avec succès'
    });
  } catch (error) {
    console.error('Resend email error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi de l\'email'
    });
  }
});

// @route   GET /api/tickets/:ticketId/qr
// @desc    Get QR code image for ticket
// @access  Private
router.get('/:ticketId/qr', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId,
      userId: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }

    const qrCodeImage = await QRCode.toBuffer(ticket.qrCode.data, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': qrCodeImage.length,
      'Cache-Control': 'public, max-age=3600'
    });

    res.send(qrCodeImage);
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du QR code'
    });
  }
});

// @route   DELETE /api/tickets/:ticketId
// @desc    Cancel ticket (if refund is allowed)
// @access  Private
router.delete('/:ticketId', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId,
      userId: req.user._id
    }).populate('eventId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }

    if (ticket.status === 'used' || ticket.qrCode.scanned) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler un billet déjà utilisé'
      });
    }

    // Check if cancellation is allowed (e.g., 24h before event)
    const eventDate = new Date(ticket.eventId.date);
    const now = new Date();
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);

    if (hoursUntilEvent < 24) {
      return res.status(400).json({
        success: false,
        message: 'Annulation impossible moins de 24h avant l\'événement'
      });
    }

    // Mark as cancelled
    ticket.status = 'cancelled';
    await ticket.save();

    // Update event stats
    await Event.findByIdAndUpdate(ticket.eventId._id, {
      $inc: { ticketsSold: -ticket.quantity, revenue: -ticket.totalPrice }
    });

    res.json({
      success: true,
      message: 'Billet annulé avec succès'
    });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du billet'
    });
  }
});

export default router;