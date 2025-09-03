import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Event from '../models/Event.js';
import { authenticate, adminOnly, optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'events');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `event-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Validation rules
const eventValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Le titre doit contenir entre 3 et 200 caractères'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('La description doit contenir entre 10 et 2000 caractères'),
  body('date').isISO8601().withMessage('Date invalide').custom(value => {
    if (new Date(value) <= new Date()) {
      throw new Error('La date doit être dans le futur');
    }
    return true;
  }),
  body('capacity').isInt({ min: 1 }).withMessage('La capacité doit être un nombre positif'),
  body('price').isNumeric({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('category').isIn(['concert', 'theatre', 'sport', 'conference', 'festival', 'exposition', 'spectacle', 'autre'])
    .withMessage('Catégorie invalide')
];

// @route   GET /api/events
// @desc    Get all published events with filters and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional(),
  query('city').optional(),
  query('search').optional(),
  query('sortBy').optional().isIn(['date', 'price', 'title', 'popularity']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      city,
      search,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build filter
    let filter = {
      status: 'published',
      isActive: true,
      date: { $gt: new Date() }
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.name': new RegExp(search, 'i') }
      ];
    }

    // Build sort
    let sortObj = {};
    switch (sortBy) {
      case 'price':
        sortObj.price = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'title':
        sortObj.title = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'popularity':
        sortObj.ticketsSold = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortObj.date = sortOrder === 'desc' ? -1 : 1;
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalEvents: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
});

// @route   GET /api/events/featured
// @desc    Get featured events
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.find({
      status: 'published',
      isActive: true,
      isFeatured: true,
      date: { $gt: new Date() }
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ date: 1 })
    .limit(6);

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements vedettes'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Check if user can view unpublished events
    if (event.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'événement'
    });
  }
});

// @route   POST /api/events
// @desc    Create event (Admin only)
// @access  Private/Admin
router.post('/', authenticate, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    console.log('📝 Création événement - Body:', req.body);
    console.log('📁 Fichiers reçus:', req.files);

    const {
      title,
      description,
      shortDescription,
      date,
      capacity,
      price,
      category,
      isFeatured,
      tags,
      locationName,
      locationCity,
      locationAddress,
      locationRegion,
      organizerName,
      organizerEmail,
      organizerPhone,
      organizerWebsite
    } = req.body;

    // Validation manuelle
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Le titre doit contenir au moins 3 caractères'
      });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'La description doit contenir au moins 10 caractères'
      });
    }

    if (!date || new Date(date) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La date doit être dans le futur'
      });
    }

    if (!locationName || !locationCity) {
      return res.status(400).json({
        success: false,
        message: 'Le lieu et la ville sont requis'
      });
    }

    if (!capacity || capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'La capacité doit être d\'au moins 1 personne'
      });
    }

    if (!price || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix ne peut pas être négatif'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'La catégorie est requise'
      });
    }

    if (!organizerName) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'organisateur est requis'
      });
    }

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription ? shortDescription.trim() : '',
      date: new Date(date),
      capacity: parseInt(capacity),
      price: parseFloat(price),
      category,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      location: {
        name: locationName.trim(),
        city: locationCity.trim(),
        address: locationAddress ? locationAddress.trim() : '',
        region: locationRegion ? locationRegion.trim() : ''
      },
      organizer: {
        name: organizerName.trim(),
        email: organizerEmail ? organizerEmail.trim() : '',
        phone: organizerPhone ? organizerPhone.trim() : '',
        website: organizerWebsite ? organizerWebsite.trim() : ''
      },
      createdBy: req.user._id,
      status: 'published'
    };

    // Handle tags
    if (tags) {
      if (typeof tags === 'string') {
        eventData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        eventData.tags = tags.map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // Handle images
    if (req.files && req.files.length > 0) {
      eventData.images = req.files.map((file, index) => ({
        url: `/uploads/events/${file.filename}`,
        alt: `Image ${index + 1} de ${title}`,
        isPrimary: index === 0
      }));
    }

    console.log('💾 Données événement à sauvegarder:', eventData);

    const event = new Event(eventData);
    await event.save();
    await event.populate('createdBy', 'firstName lastName');

    console.log('✅ Événement créé avec succès:', event._id);

    res.status(201).json({
      success: true,
      message: 'Événement créé avec succès',
      data: { event }
    });
  } catch (error) {
    console.error('❌ Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'événement',
      error: error.message
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event (Admin only)
// @access  Private/Admin
router.put('/:id', authenticate, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Update fields
    const allowedFields = [
      'title', 'description', 'shortDescription', 'date', 'endDate', 
      'capacity', 'price', 'category', 'tags', 'status', 'isFeatured'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'isFeatured') {
          event[field] = req.body[field] === 'true' || req.body[field] === true;
        } else if (field === 'capacity' || field === 'price') {
          event[field] = parseFloat(req.body[field]);
        } else if (field === 'date' || field === 'endDate') {
          event[field] = new Date(req.body[field]);
        } else {
          event[field] = req.body[field];
        }
      }
    });

    // Handle location
    if (req.body.locationName || req.body.locationCity) {
      event.location = {
        name: req.body.locationName || event.location.name,
        city: req.body.locationCity || event.location.city,
        address: req.body.locationAddress || event.location.address || '',
        region: req.body.locationRegion || event.location.region || ''
      };
    }

    // Handle organizer
    if (req.body.organizerName) {
      event.organizer = {
        name: req.body.organizerName,
        email: req.body.organizerEmail || '',
        phone: req.body.organizerPhone || '',
        website: req.body.organizerWebsite || ''
      };
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/events/${file.filename}`,
        alt: `Image ${index + 1} de ${event.title}`,
        isPrimary: event.images.length === 0 && index === 0
      }));
      
      event.images = [...(event.images || []), ...newImages];
    }

    await event.save();
    await event.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Événement mis à jour avec succès',
      data: { event }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'événement'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Don't actually delete if there are sold tickets
    if (event.ticketsSold > 0) {
      event.status = 'cancelled';
      event.isActive = false;
      await event.save();
      
      return res.json({
        success: true,
        message: 'Événement annulé (des billets ont été vendus)'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'événement'
    });
  }
});

export default router;