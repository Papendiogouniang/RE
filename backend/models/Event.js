import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre de l\'événement est requis'],
    trim: true,
    maxLength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxLength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  shortDescription: {
    type: String,
    maxLength: [300, 'La description courte ne peut pas dépasser 300 caractères']
  },
  date: {
    type: Date,
    required: [true, 'La date de l\'événement est requise'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'La date de l\'événement doit être dans le futur'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.date;
      },
      message: 'La date de fin doit être après la date de début'
    }
  },
  location: {
    name: {
      type: String,
      required: [true, 'Le lieu est requis']
    },
    address: String,
    city: {
      type: String,
      required: [true, 'La ville est requise']
    },
    region: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  capacity: {
    type: Number,
    required: [true, 'La capacité est requise'],
    min: [1, 'La capacité doit être d\'au moins 1 personne']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  currency: {
    type: String,
    default: 'FCFA',
    enum: ['FCFA', 'EUR', 'USD']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['concert', 'theatre', 'sport', 'conference', 'festival', 'exposition', 'spectacle', 'autre']
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  organizer: {
    name: {
      type: String,
      required: [true, 'Le nom de l\'organisateur est requis']
    },
    email: String,
    phone: String,
    website: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  isVirtualEvent: {
    type: Boolean,
    default: false
  },
  virtualEventDetails: {
    platform: String,
    link: String,
    accessCode: String
  },
  ticketsSold: {
    type: Number,
    default: 0,
    min: 0
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches et performances
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ title: 'text', description: 'text' });

// Virtual pour les billets disponibles
eventSchema.virtual('availableTickets').get(function() {
  return Math.max(0, this.capacity - this.ticketsSold);
});

// Virtual pour l'URL de l'image principale - CORRECTION
eventSchema.virtual('primaryImage').get(function() {
  if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
    return null;
  }
  const primaryImg = this.images.find(img => img && img.isPrimary);
  return primaryImg ? primaryImg.url : (this.images[0] ? this.images[0].url : null);
});

// Méthode pour vérifier si l'événement est complet
eventSchema.methods.isSoldOut = function() {
  return this.ticketsSold >= this.capacity;
};

// Méthode pour calculer le taux de remplissage
eventSchema.methods.getOccupancyRate = function() {
  return (this.ticketsSold / this.capacity) * 100;
};

export default mongoose.model('Event', eventSchema);