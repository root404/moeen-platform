import { query } from '../config/database';
import { Surah } from '../types';
import { NotFoundError } from '../utils/errors';

export class SurahService {
  // Get all surahs
  static async getAllSurahs(): Promise<Surah[]> {
    try {
      const surahs = await query(
        'SELECT * FROM surahs ORDER BY order_in_quran ASC'
      );
      return surahs;
    } catch (error) {
      throw new Error(`Failed to get surahs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get surah by ID
  static async getSurahById(surahId: number): Promise<Surah | null> {
    try {
      const surahs = await query(
        'SELECT * FROM surahs WHERE id = $1',
        [surahId]
      );
      return surahs.length > 0 ? surahs[0] : null;
    } catch (error) {
      throw new Error(`Failed to get surah: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get surahs by Juz
  static async getSurahsByJuz(juzNumber: number): Promise<Surah[]> {
    try {
      const surahs = await query(
        `SELECT * FROM surahs 
         WHERE $1 = ANY(juz_mapping)
         ORDER BY order_in_quran ASC`,
        [juzNumber]
      );
      return surahs;
    } catch (error) {
      throw new Error(`Failed to get surahs by juz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get surahs by revelation type
  static async getSurahsByRevelationType(revelationType: 'meccan' | 'medinan'): Promise<Surah[]> {
    try {
      const surahs = await query(
        'SELECT * FROM surahs WHERE revelation_type = $1 ORDER BY order_in_quran ASC',
        [revelationType]
      );
      return surahs;
    } catch (error) {
      throw new Error(`Failed to get surahs by revelation type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search surahs by name (Arabic or English)
  static async searchSurahs(searchTerm: string): Promise<Surah[]> {
    try {
      const surahs = await query(
        `SELECT * FROM surahs 
         WHERE name_ar ILIKE $1 OR name_en ILIKE $1
         ORDER BY order_in_quran ASC`,
        [`%${searchTerm}%`]
      );
      return surahs;
    } catch (error) {
      throw new Error(`Failed to search surahs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get surahs with pagination
  static async getSurahsWithPagination(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ surahs: Surah[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'order_in_quran',
        sortOrder = 'asc'
      } = options;

      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query('SELECT COUNT(*) as total FROM surahs');
      const total = parseInt(countResult[0].total);

      // Get surahs
      const surahs = await query(
        `SELECT * FROM surahs 
         ORDER BY ${sortBy} ${sortOrder} 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return { surahs, total };
    } catch (error) {
      throw new Error(`Failed to get surahs with pagination: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get random surah
  static async getRandomSurah(): Promise<Surah | null> {
    try {
      const surahs = await query(
        'SELECT * FROM surahs ORDER BY RANDOM() LIMIT 1'
      );
      return surahs.length > 0 ? surahs[0] : null;
    } catch (error) {
      throw new Error(`Failed to get random surah: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get surah statistics
  static async getSurahStatistics(): Promise<{
    totalSurahs: number;
    meccanSurahs: number;
    medinanSurahs: number;
    totalVerses: number;
    averageVersesPerSurah: number;
    shortestSurah: Surah | null;
    longestSurah: Surah | null;
  }> {
    try {
      // Get basic statistics
      const stats = await query(`
        SELECT 
          COUNT(*) as total_surahs,
          COUNT(CASE WHEN revelation_type = 'meccan' THEN 1 END) as meccan_surahs,
          COUNT(CASE WHEN revelation_type = 'medinan' THEN 1 END) as medinan_surahs,
          SUM(verses_count) as total_verses,
          ROUND(AVG(verses_count), 2) as average_verses
        FROM surahs
      `);

      // Get shortest surah
      const shortest = await query(
        'SELECT * FROM surahs ORDER BY verses_count ASC LIMIT 1'
      );

      // Get longest surah
      const longest = await query(
        'SELECT * FROM surahs ORDER BY verses_count DESC LIMIT 1'
      );

      return {
        totalSurahs: parseInt(stats[0].total_surahs),
        meccanSurahs: parseInt(stats[0].meccan_surahs),
        medinanSurahs: parseInt(stats[0].medinan_surahs),
        totalVerses: parseInt(stats[0].total_verses),
        averageVersesPerSurah: parseFloat(stats[0].average_verses),
        shortestSurah: shortest.length > 0 ? shortest[0] : null,
        longestSurah: longest.length > 0 ? longest[0] : null,
      };
    } catch (error) {
      throw new Error(`Failed to get surah statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get surahs by page range
  static async getSurahsByPageRange(startPage: number, endPage: number): Promise<Surah[]> {
    try {
      const surahs = await query(
        `SELECT * FROM surahs 
         WHERE pages_start <= $2 AND pages_end >= $1
         ORDER BY pages_start ASC`,
        [startPage, endPage]
      );
      return surahs;
    } catch (error) {
      throw new Error(`Failed to get surahs by page range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get Juz distribution for a surah
  static async getSurahJuzDistribution(surahId: number): Promise<number[]> {
    try {
      const surah = await this.getSurahById(surahId);
      if (!surah) {
        throw new NotFoundError('Surah');
      }

      return Array.isArray(surah.juz_mapping) ? surah.juz_mapping : [1];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get surah juz distribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create surah (admin function)
  static async createSurah(surahData: Omit<Surah, 'id' | 'created_at'>): Promise<Surah> {
    try {
      const newSurah = await query(
        `INSERT INTO surahs (
          name_ar, name_en, verses_count, juz_mapping, 
          pages_start, pages_end, revelation_type, order_in_quran
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [
          surahData.name_ar,
          surahData.name_en,
          surahData.verses_count,
          JSON.stringify(surahData.juz_mapping),
          surahData.pages_start,
          surahData.pages_end,
          surahData.revelation_type,
          surahData.order_in_quran,
        ]
      );

      return newSurah[0];
    } catch (error) {
      throw new Error(`Failed to create surah: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update surah (admin function)
  static async updateSurah(surahId: number, updateData: Partial<Omit<Surah, 'id' | 'created_at'>>): Promise<Surah> {
    try {
      // Check if surah exists
      const existingSurah = await this.getSurahById(surahId);
      if (!existingSurah) {
        throw new NotFoundError('Surah');
      }

      // Build dynamic update query
      const updateFields = Object.keys(updateData)
        .filter(key => updateData[key as keyof typeof updateData] !== undefined)
        .map((key, index) => {
          if (key === 'juz_mapping') {
            return `${key} = $${index + 2}::jsonb`;
          }
          return `${key} = $${index + 2}`;
        })
        .join(', ');

      const updateValues = Object.values(updateData).filter(value => value !== undefined);

      if (updateFields.length === 0) {
        return existingSurah; // No updates to make
      }

      const updatedSurah = await query(
        `UPDATE surahs SET ${updateFields} WHERE id = $1 RETURNING *`,
        [surahId, ...updateValues]
      );

      return updatedSurah[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to update surah: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete surah (admin function)
  static async deleteSurah(surahId: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM surahs WHERE id = $1', [surahId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete surah: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default SurahService;