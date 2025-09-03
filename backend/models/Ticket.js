import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    default: () => `TKT-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID utilisateur est requis']
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'L\'ID événement est requis']
  },
  paymentId: {
    type: String,
    required: [true, 'L\'ID de paiement est requis']
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [1, 'La quantité doit être d\'au moins 1'],
    max: [10, 'Maximum 10 billets par commande']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Le prix unitaire est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Le prix total est requis'],
    min: [0, 'Le prix total ne peut pas être négatif']
  },
  currency: {
    type: String,
    default: 'FCFA',
    enum: ['FCFA', 'EUR', 'USD']
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'refunded', 'used'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  qrCode: {
    data: {
      type: String,
      required: true
    },
    imageUrl: String,
    scanned: {
      type: Boolean,
      default: false
    },
    scannedAt: Date,
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  holderInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  notes: String,
  metadata: {
    userAgent: String,
    ipAddress: String,
    paymentMethod: String,
    deviceType: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les performances
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ userId: 1 });
ticketSchema.index({ eventId: 1 });
ticketSchema.index({ paymentId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ 'qrCode.data': 1 });
ticketSchema.index({ createdAt: -1 });

// Virtual pour le nom complet du détenteur
ticketSchema.virtual('holderFullName').get(function() {
  if (this.holderInfo.firstName && this.holderInfo.lastName) {
    return `${this.holderInfo.firstName} ${this.holderInfo.lastName}`;
  }
  return null;
});

// Pré-middleware pour générer les données QR
ticketSchema.pre('save', function(next) {
  if (this.isNew && !this.qrCode.data) {
    this.qrCode.data = `${process.env.QR_CODE_BASE_URL || 'http://localhost:5173/verify-ticket'}/${this.ticketId}`;
  }
  next();
});

// Méthode pour marquer comme scanné
ticketSchema.methods.markAsScanned = function(scannedBy) {
  this.qrCode.scanned = true;
  this.qrCode.scannedAt = new Date();
  this.qrCode.scannedBy = scannedBy;
  this.status = 'used';
  return this.save();
};

// Méthode pour vérifier si le ticket est valide
ticketSchema.methods.isValid = function() {
  return this.status === 'paid' && !this.qrCode.scanned;
};

// Méthode pour obtenir les infos de validation
ticketSchema.methods.getValidationInfo = function() {
  return {
    isValid: this.isValid(),
    status: this.status,
    isScanned: this.qrCode.scanned,
    scannedAt: this.qrCode.scannedAt,
    ticketId: this.ticketId,
    holderName: this.holderFullName,
    eventTitle: this.eventId?.title,
    eventDate: this.eventId?.date
  };
};

export default mongoose.model('Ticket', ticketSchema);