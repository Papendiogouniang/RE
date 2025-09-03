import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre du slide est requis'],
    trim: true,
    maxLength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  subtitle: {
    type: String,
    trim: true,
    maxLength: [300, 'Le sous-titre ne peut pas dépasser 300 caractères']
  },
  description: {
    type: String,
    maxLength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  image: {
    url: {
      type: String,
      required: [true, 'L\'image est requise']
    },
    alt: String
  },
  buttonText: {
    type: String,
    maxLength: [50, 'Le texte du bouton ne peut pas dépasser 50 caractères']
  },
  buttonLink: {
    type: String,
    maxLength: [500, 'Le lien ne peut pas dépasser 500 caractères']
  },
  order: {
    type: Number,
    required: [true, 'L\'ordre est requis'],
    min: [0, 'L\'ordre doit être un nombre positif']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  backgroundColor: {
    type: String,
    default: '#FFD700',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
  },
  textColor: {
    type: String,
    default: '#000000',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide']
  },
  position: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'center'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index pour l'ordre et les performances
slideSchema.index({ order: 1 });
slideSchema.index({ isActive: 1 });
slideSchema.index({ startDate: 1, endDate: 1 });

// Méthode pour vérifier si le slide est actif
slideSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  const isActive = this.isActive;
  const isInDateRange = (!this.startDate || this.startDate <= now) && 
                       (!this.endDate || this.endDate >= now);
  
  return isActive && isInDateRange;
};

export default mongoose.model('Slide', slideSchema);