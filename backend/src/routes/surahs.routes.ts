import express from 'express';
import { SurahController } from '../controllers/surah.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate, paginationSchema, idParamSchema } from '../middleware/validation.middleware';

const router = express.Router();

/**
 * @route   GET /api/surahs
 * @desc    Get all Quran chapters with pagination
 * @access   Public
 */
router.get('/', 
  validate(paginationSchema, 'query'),
  SurahController.getAllSurahs
);

/**
 * @route   GET /api/surahs/search
 * @desc    Search Quran chapters by name
 * @access   Public
 */
router.get('/search', 
  SurahController.searchSurahs
);

/**
 * @route   GET /api/surahs/juz/:juzNumber
 * @desc    Get chapters by Juz number
 * @access   Public
 */
router.get('/juz/:juzNumber', 
  SurahController.getSurahsByJuz
);

/**
 * @route   GET /api/surahs/revelation/:type
 * @desc    Get chapters by revelation type (meccan/medinan)
 * @access   Public
 */
router.get('/revelation/:type', 
  SurahController.getSurahsByRevelationType
);

/**
 * @route   GET /api/surahs/pages/:startPage/:endPage
 * @desc    Get chapters within page range
 * @access   Public
 */
router.get('/pages/:startPage/:endPage', 
  SurahController.getSurahsByPageRange
);

/**
 * @route   GET /api/surahs/random
 * @desc    Get a random chapter
 * @access   Public
 */
router.get('/random', 
  SurahController.getRandomSurah
);

/**
 * @route   GET /api/surahs/:id
 * @desc    Get specific chapter by ID
 * @access   Public
 */
router.get('/:id', 
  validate(idParamSchema, 'params'),
  SurahController.getSurahById
);

/**
 * @route   GET /api/surahs/:id/juz
 * @desc    Get Juz distribution for a chapter
 * @access   Public
 */
router.get('/:id/juz', 
  validate(idParamSchema, 'params'),
  SurahController.getSurahJuzDistribution
);

/**
 * @route   GET /api/surahs/statistics
 * @desc    Get Quran statistics
 * @access   Public
 */
router.get('/statistics', 
  SurahController.getSurahStatistics
);

/**
 * @route   POST /api/surahs (admin only)
 * @desc    Create new chapter
 * @access   Admin
 */
router.post('/', 
  authenticateToken,
  requireAdmin,
  SurahController.createSurah
);

/**
 * @route   PUT /api/surahs/:id (admin only)
 * @desc    Update chapter
 * @access   Admin
 */
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  validate(idParamSchema, 'params'),
  SurahController.updateSurah
);

/**
 * @route   DELETE /api/surahs/:id (admin only)
 * @desc    Delete chapter
 * @access   Admin
 */
router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  validate(idParamSchema, 'params'),
  SurahController.deleteSurah
);

export default router;