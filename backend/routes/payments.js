import express from 'express';
import { body, validationResult } from 'express-validator';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import paymentService from '../services/paymentService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Validation rules
const purchaseValidation = [
  body('eventId').isMongoId().withMessage('ID événement invalide'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantité invalide (1-10)'),
  body('recipientNumber').matches(/^(\+221|00221)?[7][0-9]{8}$/).withMessage('Numéro de téléphone sénégalais invalide'),
  body('paymentMethod').isIn(['orange_money', 'free_money', 'wave', 'touch_point']).withMessage('Méthode de paiement invalide')
];

// @route   POST /api/payments/purchase
// @desc    Purchase ticket and initiate payment
// @access  Private
router.post('/purchase', authenticate, purchaseValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { eventId, quantity, recipientNumber, paymentMethod } = req.body;

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Check availability
    if (event.availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Pas assez de billets disponibles'
      });
    }

    // Check if event is still valid
    if (event.date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Événement déjà passé'
      });
    }

    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Événement non disponible'
      });
    }

    const user = req.user;
    const unitPrice = event.price;
    const totalPrice = unitPrice * quantity;

    // Create ticket (pending payment)
    const ticket = new Ticket({
      userId: user._id,
      eventId: event._id,
      quantity,
      unitPrice,
      totalPrice,
      currency: event.currency || 'FCFA',
      holderInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: recipientNumber
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        paymentMethod,
        deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
      }
    });

    await ticket.save();

    // Prepare payment data
    const paymentData = {
      amount: totalPrice,
      recipientNumber,
      recipientEmail: user.email,
      recipientFirstName: user.firstName,
      recipientLastName: user.lastName,
      callback: `${req.protocol}://${req.get('host')}/api/payments/callback`,
      idFromClient: ticket.ticketId
    };

    // Initiate payment based on method
    let paymentResult;
    switch (paymentMethod) {
      case 'orange_money':
        paymentResult = await paymentService.initiateOrangeMoney(paymentData);
        break;
      case 'free_money':
        paymentResult = await paymentService.initiateFreeMoney(paymentData);
        break;
      case 'wave':
        paymentResult = await paymentService.initiateWave(paymentData);
        break;
      case 'touch_point':
        paymentResult = await paymentService.initiateTouchPoint(paymentData);
        break;
      default:
        paymentResult = await paymentService.initiatePayment(paymentData);
    }

    if (!paymentResult.success) {
      // Delete the ticket if payment failed to initiate
      await Ticket.findByIdAndDelete(ticket._id);
      
      return res.status(400).json({
        success: false,
        message: 'Erreur lors de l\'initiation du paiement',
        error: paymentResult.error
      });
    }

    // Update ticket with payment info
    ticket.paymentId = paymentResult.transactionId;
    ticket.paymentStatus = 'processing';
    await ticket.save();

    res.json({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        ticket: {
          ticketId: ticket.ticketId,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          totalPrice: ticket.totalPrice,
          currency: ticket.currency,
          qrCode: ticket.qrCode.data
        },
        payment: {
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          paymentUrl: paymentResult.paymentUrl,
          redirectUrl: process.env.VITE_INTOUCH_REDIRECT_URL
        },
        event: {
          title: event.title,
          date: event.date,
          location: event.location
        }
      }
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'achat du billet'
    });
  }
});

// @route   POST /api/payments/callback
// @desc    Handle payment callback from InTouch
// @access  Public
router.post('/callback', async (req, res) => {
  try {
    console.log('📞 Payment callback received:', req.body);

    const callbackResult = await paymentService.handleCallback(req.body);
    
    if (!callbackResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Callback invalide'
      });
    }

    const { transactionId, status, isPaid, idFromClient } = callbackResult;

    // Find ticket by ID or payment ID
    let ticket = await Ticket.findOne({
      $or: [
        { ticketId: idFromClient },
        { paymentId: transactionId }
      ]
    }).populate('eventId').populate('userId');

    if (!ticket) {
      console.error('❌ Ticket non trouvé pour callback:', { transactionId, idFromClient });
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }

    // Update ticket status
    ticket.paymentStatus = status;
    
    if (isPaid && ticket.status === 'pending') {
      ticket.status = 'paid';
      
      // Update event stats
      await Event.findByIdAndUpdate(ticket.eventId._id, {
        $inc: { 
          ticketsSold: ticket.quantity,
          revenue: ticket.totalPrice
        }
      });

      // Send ticket email (non-blocking)
      emailService.sendTicketEmail(ticket.userId, ticket, ticket.eventId)
        .catch(err => console.error('Erreur envoi email ticket:', err));
        
      console.log(`✅ Paiement confirmé pour ticket ${ticket.ticketId}`);
    } else if (!isPaid) {
      ticket.status = status === 'failed' ? 'cancelled' : ticket.status;
      console.log(`❌ Paiement échoué pour ticket ${ticket.ticketId}: ${status}`);
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Callback traité avec succès'
    });
  } catch (error) {
    console.error('❌ Payment callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du callback'
    });
  }
});

// @route   GET /api/payments/verify/:transactionId
// @desc    Verify payment status
// @access  Private
router.get('/verify/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Find ticket
    const ticket = await Ticket.findOne({
      $or: [
        { ticketId: transactionId },
        { paymentId: transactionId }
      ],
      userId: req.user._id
    }).populate('eventId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    // Verify with InTouch
    const verificationResult = await paymentService.verifyPayment(ticket.paymentId);
    
    if (verificationResult.success) {
      // Update ticket if status changed
      if (verificationResult.isPaid && ticket.status !== 'paid') {
        ticket.status = 'paid';
        ticket.paymentStatus = 'completed';
        
        // Update event stats
        await Event.findByIdAndUpdate(ticket.eventId._id, {
          $inc: { 
            ticketsSold: ticket.quantity,
            revenue: ticket.totalPrice
          }
        });

        await ticket.save();
        
        // Send ticket email
        const user = await User.findById(ticket.userId);
        emailService.sendTicketEmail(user, ticket, ticket.eventId)
          .catch(err => console.error('Erreur envoi email:', err));
      }
    }

    res.json({
      success: true,
      data: {
        ticket: {
          ticketId: ticket.ticketId,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          isPaid: ticket.status === 'paid'
        },
        payment: verificationResult.data,
        verification: verificationResult
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du paiement'
    });
  }
});

// @route   GET /api/payments/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    data: {
      methods: [
        {
          id: 'orange_money',
          name: 'Orange Money',
          icon: '🟠',
          description: 'Paiement via Orange Money',
          isActive: true
        },
        {
          id: 'free_money',
          name: 'Free Money',
          icon: '🔵',
          description: 'Paiement via Free Money (Tigo)',
          isActive: true
        },
        {
          id: 'wave',
          name: 'Wave',
          icon: '💙',
          description: 'Paiement via Wave',
          isActive: true
        },
        {
          id: 'touch_point',
          name: 'Touch Point',
          icon: '💳',
          description: 'Paiement via Touch Point',
          isActive: true
        }
      ]
    }
  });
});

export default router;