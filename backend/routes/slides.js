import express from 'express';
import { body, validationResult } from 'express-validator';
import Slide from '../models/Slide.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Multer configuration for slide images
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'slides');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `slide-${uniqueSuffix}${path.extname(file.originalname)}`);
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
const slideValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Le titre doit contenir entre 3 et 200 caractères'),
  body('subtitle').optional().trim().isLength({ max: 300 }).withMessage('Le sous-titre ne peut pas dépasser 300 caractères'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('buttonText').optional().trim().isLength({ max: 50 }).withMessage('Le texte du bouton ne peut pas dépasser 50 caractères'),
  body('buttonLink').optional().trim().isLength({ max: 500 }).withMessage('Le lien ne peut pas dépasser 500 caractères'),
  body('order').isInt({ min: 0 }).withMessage('L\'ordre doit être un nombre positif'),
  body('backgroundColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Couleur de fond invalide'),
  body('textColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Couleur de texte invalide'),
  body('position').optional().isIn(['left', 'center', 'right']).withMessage('Position invalide')
];

// @route   GET /api/slides
// @desc    Get all active slides
// @access  Public
router.get('/', async (req, res) => {
  try {
    const slides = await Slide.find({
      isActive: true,
      $or: [
        { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } },
        { startDate: { $lte: new Date() }, endDate: { $exists: false } },
        { startDate: { $exists: false } }
      ]
    })
    .populate('eventId', 'title date location')
    .sort({ order: 1 });

    res.json({
      success: true,
      data: { slides }
    });
  } catch (error) {
    console.error('Get slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des slides'
    });
  }
});

// @route   GET /api/slides/admin
// @desc    Get all slides for admin
// @access  Private/Admin
router.get('/admin', authenticate, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [slides, total] = await Promise.all([
      Slide.find()
        .populate('eventId', 'title date')
        .populate('createdBy', 'firstName lastName')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Slide.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        slides,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSlides: total
        }
      }
    });
  } catch (error) {
    console.error('Get admin slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des slides'
    });
  }
});

// @route   GET /api/slides/:id
// @desc    Get single slide
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id)
      .populate('eventId', 'title date location')
      .populate('createdBy', 'firstName lastName');

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide non trouvé'
      });
    }

    res.json({
      success: true,
      data: { slide }
    });
  } catch (error) {
    console.error('Get slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du slide'
    });
  }
});

// @route   POST /api/slides
// @desc    Create slide (Admin only)
// @access  Private/Admin
router.post('/', authenticate, adminOnly, upload.single('image'), slideValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const slideData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Handle image upload
    if (req.file) {
      slideData.image = {
        url: `/uploads/slides/${req.file.filename}`,
        alt: req.body.title
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Une image est requise'
      });
    }

    // Handle dates
    if (req.body.startDate) {
      slideData.startDate = new Date(req.body.startDate);
    }
    if (req.body.endDate) {
      slideData.endDate = new Date(req.body.endDate);
    }

    const slide = new Slide(slideData);
    await slide.save();
    await slide.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Slide créé avec succès',
      data: { slide }
    });
  } catch (error) {
    console.error('Create slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du slide'
    });
  }
});

// @route   PUT /api/slides/:id
// @desc    Update slide (Admin only)
// @access  Private/Admin
router.put('/:id', authenticate, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide non trouvé'
      });
    }

    // Update fields
    const allowedFields = [
      'title', 'subtitle', 'description', 'buttonText', 'buttonLink',
      'order', 'isActive', 'startDate', 'endDate', 'backgroundColor',
      'textColor', 'position', 'eventId'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          slide[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          slide[field] = req.body[field];
        }
      }
    });

    // Handle new image
    if (req.file) {
      slide.image = {
        url: `/uploads/slides/${req.file.filename}`,
        alt: slide.title
      };
    }

    await slide.save();
    await slide.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Slide mis à jour avec succès',
      data: { slide }
    });
  } catch (error) {
    console.error('Update slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du slide'
    });
  }
});

// @route   DELETE /api/slides/:id
// @desc    Delete slide (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide non trouvé'
      });
    }

    await Slide.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Slide supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du slide'
    });
  }
});

// @route   PUT /api/slides/:id/toggle
// @desc    Toggle slide active status
// @access  Private/Admin
router.put('/:id/toggle', authenticate, adminOnly, async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide non trouvé'
      });
    }

    slide.isActive = !slide.isActive;
    await slide.save();

    res.json({
      success: true,
      message: `Slide ${slide.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: { slide }
    });
  } catch (error) {
    console.error('Toggle slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
});

// @route   PUT /api/slides/reorder
// @desc    Reorder slides
// @access  Private/Admin
router.put('/reorder', authenticate, adminOnly, [
  body('slides').isArray().withMessage('Liste des slides requise'),
  body('slides.*.id').isMongoId().withMessage('ID slide invalide'),
  body('slides.*.order').isInt({ min: 0 }).withMessage('Ordre invalide')
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

    const { slides } = req.body;

    // Update each slide's order
    const updatePromises = slides.map(({ id, order }) =>
      Slide.findByIdAndUpdate(id, { order }, { new: true })
    );

    const updatedSlides = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Ordre des slides mis à jour avec succès',
      data: { slides: updatedSlides }
    });
  } catch (error) {
    console.error('Reorder slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réorganisation des slides'
    });
  }
});

export default router;