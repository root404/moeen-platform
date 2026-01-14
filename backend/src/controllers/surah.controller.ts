import { Response } from 'express';
import { AuthRequest } from '../types';
import { SurahService } from '../models/Surah.model';
import { 
  sendSuccess, 
  sendError, 
  asyncHandler,
  parseInteger
} from '../utils/errors';
import { AuditLogService } from '../models/AuditLog.model';
import { activityLogger } from '../utils/logger';

export class SurahController {
  /**
   * Get all Quran chapters with pagination
   */
  static getAllSurahs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, sortBy = 'order_in_quran', sortOrder = 'asc' } = req.query;
    const userId = req.userId;

    try {
      const options = {
        page: parseInteger(page, 'page'),
        limit: parseInteger(limit, 'limit'),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const { surahs, total } = await SurahService.getSurahsWithPagination(options);

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'list', 'read', true);
      }

      sendSuccess(res, surahs, 'Surahs retrieved successfully', {
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      });

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'list', 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Search Quran chapters by name
   */
  static searchSurahs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { q, page = 1, limit = 20 } = req.query;
    const userId = req.userId;

    try {
      if (!q) {
        return sendError(res, {
          message: 'Search query is required',
          code: 'SEARCH_QUERY_REQUIRED'
        }, 400);
      }

      const searchTerm = q as string;
      const options = {
        page: parseInteger(page, 'page'),
        limit: parseInteger(limit, 'limit')
      };

      const surahs = await SurahService.searchSurahs(searchTerm);

      // Log search activity
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'search', 'read', true, {
          searchTerm
        });
      }

      activityLogger('Surah search performed', userId, {
        searchTerm,
        resultsCount: surahs.length
      });

      sendSuccess(res, surahs, 'Search completed successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'search', 'read', false, {
          error: error.message,
          searchTerm: q
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get chapters by Juz number
   */
  static getSurahsByJuz = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { juzNumber } = req.params;
    const userId = req.userId;

    try {
      const juz = parseInteger(juzNumber, 'juzNumber', 1, 30);
      const surahs = await SurahService.getSurahsByJuz(juz);

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'by_juz', 'read', true, {
          juzNumber: juz
        });
      }

      sendSuccess(res, {
        juzNumber,
        surahs
      }, `Chapters for Juz ${juz} retrieved successfully`);

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'by_juz', 'read', false, {
          error: error.message,
          juzNumber
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get chapters by revelation type
   */
  static getSurahsByRevelationType = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type } = req.params;
    const userId = req.userId;

    try {
      if (!['meccan', 'medinan'].includes(type)) {
        return sendError(res, {
          message: 'Invalid revelation type. Must be "meccan" or "medinan"',
          code: 'INVALID_REVELATION_TYPE'
        }, 400);
      }

      const revelationType = type as 'meccan' | 'medinan';
      const surahs = await SurahService.getSurahsByRevelationType(revelationType);

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'by_revelation', 'read', true, {
          revelationType
        });
      }

      sendSuccess(res, {
        revelationType,
        surahs
      }, `${revelationType.charAt(0).toUpperCase() + revelationType.slice(1)} chapters retrieved successfully`);

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'by_revelation', 'read', false, {
          error: error.message,
          revelationType: type
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get chapters within page range
   */
  static getSurahsByPageRange = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { startPage, endPage } = req.params;
    const userId = req.userId;

    try {
      const start = parseInteger(startPage, 'startPage', 1, 604);
      const end = parseInteger(endPage, 'endPage', 1, 604);

      if (start > end) {
        return sendError(res, {
          message: 'Start page must be less than or equal to end page',
          code: 'INVALID_PAGE_RANGE'
        }, 400);
      }

      const surahs = await SurahService.getSurahsByPageRange(start, end);

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'by_page_range', 'read', true, {
          startPage: start,
          endPage
        });
      }

      sendSuccess(res, {
        pageRange: { start, end },
        surahs
      }, `Chapters from page ${start} to ${end} retrieved successfully`);

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'by_page_range', 'read', false, {
          error: error.message,
          startPage,
          endPage
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get a random chapter
   */
  static getRandomSurah = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      const surah = await SurahService.getRandomSurah();

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'random', 'read', true);
      }

      if (!surah) {
        return sendError(res, {
          message: 'No chapters found',
          code: 'NO_SURAHS_FOUND'
        }, 404);
      }

      sendSuccess(res, surah, 'Random chapter retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'random', 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get specific chapter by ID
   */
  static getSurahById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const surahId = parseInteger(id, 'surahId', 1, 114);
      const surah = await SurahService.getSurahById(surahId);

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', id, 'read', true, {
          surahId
        });
      }

      if (!surah) {
        return sendError(res, {
          message: 'Chapter not found',
          code: 'SURAH_NOT_FOUND'
        }, 404);
      }

      sendSuccess(res, surah, 'Chapter retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', id, 'read', false, {
          error: error.message,
          surahId
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get Juz distribution for a chapter
   */
  static getSurahJuzDistribution = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const surahId = parseInteger(id, 'surahId', 1, 114);
      const juzDistribution = await SurahService.getSurahJuzDistribution(surahId);

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', `${id}/juz`, 'read', true, {
          surahId
        });
      }

      sendSuccess(res, {
        surahId,
        juzDistribution
      }, 'Juz distribution retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', `${id}/juz`, 'read', false, {
          error: error.message,
          surahId
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get Quran statistics
   */
  static getSurahStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      const statistics = await SurahService.getSurahStatistics();

      // Log data access
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'statistics', 'read', true);
      }

      sendSuccess(res, statistics, 'Quran statistics retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'surah', 'statistics', 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Create new chapter (admin only)
   */
  static createSurah = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const surahData = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      const newSurah = await SurahService.createSurah(surahData);

      // Log admin action
      await AuditLogService.logAdminAction('create_surah', adminId, undefined, {
        createdSurahId: newSurah.id,
        surahName: newSurah.name_ar,
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('Chapter created by admin', adminId, {
        createdSurahId: newSurah.id,
        surahName: newSurah.name_ar
      });

      sendSuccess(res, newSurah, 'Chapter created successfully', 201);

    } catch (error: any) {
      await AuditLogService.logAdminAction('create_surah', adminId, undefined, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });

  /**
   * Update chapter (admin only)
   */
  static updateSurah = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.userId;
    const updateData = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      const surahId = parseInteger(id, 'surahId', 1, 114);
      const updatedSurah = await SurahService.updateSurah(surahId, updateData);

      // Log admin action
      await AuditLogService.logAdminAction('update_surah', adminId, undefined, {
        updatedSurahId: surahId,
        updatedFields: Object.keys(updateData),
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('Chapter updated by admin', adminId, {
        updatedSurahId: surahId,
        updatedFields: Object.keys(updateData)
      });

      sendSuccess(res, updatedSurah, 'Chapter updated successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('update_surah', adminId, undefined, {
        error: error.message,
        surahId: id,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });

  /**
   * Delete chapter (admin only)
   */
  static deleteSurah = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.userId;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      const surahId = parseInteger(id, 'surahId', 1, 114);
      const success = await SurahService.deleteSurah(surahId);

      if (!success) {
        return sendError(res, {
          message: 'Chapter not found',
          code: 'SURAH_NOT_FOUND'
        }, 404);
      }

      // Log admin action
      await AuditLogService.logAdminAction('delete_surah', adminId, undefined, {
        deletedSurahId: surahId,
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('Chapter deleted by admin', adminId, {
        deletedSurahId: surahId
      });

      sendSuccess(res, null, 'Chapter deleted successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('delete_surah', adminId, undefined, {
        error: error.message,
        surahId: id,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });
}

export default SurahController;