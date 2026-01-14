import { query, transaction } from '../config/database';
import { User, UserCreateInput, UserUpdateInput, AuthRequest } from '../types';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { hashPassword, comparePassword, generateUUID } from '../utils/helpers';

export class UserService {
  // Create a new user
  static async createUser(userData: UserCreateInput): Promise<User> {
    try {
      // Check if email already exists
      const existingUsers = await query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUsers.length > 0) {
        throw new ConflictError('Email already exists');
      }

      // Hash the password
      const passwordHash = await hashPassword(userData.password);

      // Insert new user
      const newUser = await query(
        `INSERT INTO users (
          email, password_hash, role, subscription_type, 
          date_of_birth, country, gender, phone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [
          userData.email,
          passwordHash,
          userData.role || 'user',
          userData.subscription_type || 'free',
          userData.date_of_birth || null,
          userData.country || null,
          userData.gender || null,
          userData.phone || null,
        ]
      );

      return newUser[0];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const users = await query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update user
  static async updateUser(userId: string, updateData: UserUpdateInput): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User');
      }

      // If updating email, check for duplicates
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailCheck = await query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [updateData.email, userId]
        );

        if (emailCheck.length > 0) {
          throw new ConflictError('Email already exists');
        }
      }

      // If updating password, hash it
      if (updateData.password_hash) {
        updateData.password_hash = await hashPassword(updateData.password_hash as any);
      }

      // Build dynamic update query
      const updateFields = Object.keys(updateData)
        .filter(key => updateData[key as keyof UserUpdateInput] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const updateValues = Object.values(updateData).filter(value => value !== undefined);

      if (updateFields.length === 0) {
        return existingUser; // No updates to make
      }

      const updatedUser = await query(
        `UPDATE users SET ${updateFields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [userId, ...updateValues]
      );

      return updatedUser[0];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete user (soft delete - set is_active to false)
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Authenticate user (for login)
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.is_active) {
        return null;
      }

      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return null;
      }

      // Update last active timestamp
      await this.updateUser(userId, { last_active: new Date() });

      return user;
    } catch (error) {
      throw new Error(`Failed to authenticate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Change user password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User');
      }

      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new BadRequestError('Current password is incorrect');
      }

      const newPasswordHash = await hashPassword(newPassword);
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );

      return true;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user statistics
  static async getUserStats(userId: string): Promise<any> {
    try {
      const stats = await query(
        'SELECT * FROM user_stats WHERE id = $1',
        [userId]
      );
      return stats.length > 0 ? stats[0] : null;
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update last active timestamp
  static async updateLastActive(userId: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to update last active: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get users with pagination
  static async getUsers(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        search
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE is_active = true';
      let countClause = 'WHERE is_active = true';
      const queryParams: any[] = [];

      // Add search functionality
      if (search) {
        whereClause += ` AND (email ILIKE $${queryParams.length + 1} OR country ILIKE $${queryParams.length + 1})`;
        countClause += ` AND (email ILIKE $1 OR country ILIKE $1)`;
        queryParams.push(`%${search}%`);
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM users ${countClause}`,
        search ? [queryParams[0]] : []
      );
      const total = parseInt(countResult[0].total);

      // Get users
      const users = await query(
        `SELECT id, email, role, subscription_type, date_of_birth, country, gender, 
                is_active, email_verified, created_at, last_active, updated_at
         FROM users 
         ${whereClause} 
         ORDER BY ${sortBy} ${sortOrder} 
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      return { users, total };
    } catch (error) {
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify user email
  static async verifyEmail(userId: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to verify email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Deactivate user
  static async deactivateUser(userId: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Activate user
  static async activateUser(userId: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to activate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default UserService;