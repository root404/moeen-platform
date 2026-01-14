import { query } from '../config/database';
import { AuditLog, AuditLogCreateInput } from '../types';
import { BadRequestError } from '../utils/errors';

export class AuditLogService {
  // Create an audit log entry
  static async createAuditLog(logData: AuditLogCreateInput): Promise<AuditLog> {
    try {
      const newLog = await query(
        `INSERT INTO audit_logs (
          action_type, actor, target_user_id, details, ip_address,
          user_agent, success, error_message, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          logData.action_type,
          logData.actor,
          logData.target_user_id || null,
          logData.details ? JSON.stringify(logData.details) : null,
          logData.ip_address || null,
          logData.user_agent || null,
          logData.success !== undefined ? logData.success : true,
          logData.error_message || null,
          logData.timestamp || new Date(),
        ]
      );

      return newLog[0];
    } catch (error) {
      throw new Error(`Failed to create audit log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get audit logs with pagination and filtering
  static async getAuditLogs(options: {
    page?: number;
    limit?: number;
    actionType?: string;
    actor?: string;
    targetUserId?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 50,
        actionType,
        actor,
        targetUserId,
        startDate,
        endDate,
        success,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];

      // Add filters
      if (actionType) {
        whereClause += ` AND action_type = $${queryParams.length + 1}`;
        queryParams.push(actionType);
      }

      if (actor) {
        whereClause += ` AND actor ILIKE $${queryParams.length + 1}`;
        queryParams.push(`%${actor}%`);
      }

      if (targetUserId) {
        whereClause += ` AND target_user_id = $${queryParams.length + 1}`;
        queryParams.push(targetUserId);
      }

      if (startDate) {
        whereClause += ` AND timestamp >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND timestamp <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      if (success !== undefined) {
        whereClause += ` AND success = $${queryParams.length + 1}`;
        queryParams.push(success);
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult[0].total);

      // Get logs
      const logs = await query(
        `SELECT * FROM audit_logs 
         ${whereClause} 
         ORDER BY ${sortBy} ${sortOrder} 
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      return { logs, total };
    } catch (error) {
      throw new Error(`Failed to get audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get audit log by ID
  static async getAuditLogById(logId: string): Promise<AuditLog | null> {
    try {
      const logs = await query(
        'SELECT * FROM audit_logs WHERE log_id = $1',
        [logId]
      );
      return logs.length > 0 ? logs[0] : null;
    } catch (error) {
      throw new Error(`Failed to get audit log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get audit logs for a specific user
  static async getUserAuditLogs(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      actionType?: string;
      startDate?: Date;
      endDate?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 50,
        actionType,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE target_user_id = $1';
      const queryParams: any[] = [userId];

      if (actionType) {
        whereClause += ` AND action_type = $${queryParams.length + 1}`;
        queryParams.push(actionType);
      }

      if (startDate) {
        whereClause += ` AND timestamp >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND timestamp <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult[0].total);

      // Get logs
      const logs = await query(
        `SELECT * FROM audit_logs 
         ${whereClause} 
         ORDER BY ${sortBy} ${sortOrder} 
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      return { logs, total };
    } catch (error) {
      throw new Error(`Failed to get user audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Log authentication events
  static async logAuthEvent(
    eventType: 'login' | 'logout' | 'register' | 'password_change' | 'password_reset',
    userId?: string,
    success: boolean,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      action_type: `auth_${eventType}`,
      actor: userId || 'anonymous',
      target_user_id: userId,
      details: {
        eventType,
        success,
        ...details,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
      error_message: success ? null : (details?.error || 'Authentication failed'),
    });
  }

  // Log API access events
  static async logApiAccess(
    endpoint: string,
    method: string,
    userId?: string,
    success: boolean,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      action_type: 'api_access',
      actor: userId || 'anonymous',
      target_user_id: userId,
      details: {
        endpoint,
        method,
        success,
        ...details,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
      error_message: success ? null : (details?.error || 'API access failed'),
    });
  }

  // Admin action logging
  static async logAdminAction(
    action: string,
    adminId: string,
    targetUserId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      action_type: 'admin_action',
      actor: adminId,
      target_user_id: targetUserId,
      details: {
        adminAction: action,
        ...details,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      success: true,
    });
  }

  // Security event logging
  static async logSecurityEvent(
    eventType: 'rate_limit_exceeded' | 'unauthorized_access' | 'suspicious_activity' | 'quota_exceeded',
    userId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      action_type: 'security_event',
      actor: userId || 'anonymous',
      target_user_id: userId,
      details: {
        securityEventType: eventType,
        ...details,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      success: false,
      error_message: `Security event: ${eventType}`,
    });
  }

  // Quota consumption logging
  static async logQuotaConsumption(
    userId: string,
    consumed: number,
    quotaType: 'ai_api' | 'exam' | 'istighfar',
    details?: any
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      action_type: 'quota_consumption',
      actor: userId,
      target_user_id: userId,
      details: {
        consumed,
        quotaType,
        ...details,
      },
      success: true,
    });
  }

  // Data access logging
  static async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    success: boolean = true,
    details?: any
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      action_type: 'data_access',
      actor: userId,
      target_user_id: userId,
      details: {
        resourceType,
        resourceId,
        action,
        success,
        ...details,
      },
      success,
      error_message: success ? null : `Data access failed: ${action} on ${resourceType}:${resourceId}`,
    });
  }

  // Get audit log statistics
  static async getAuditLogStatistics(options: {
    startDate?: Date;
    endDate?: Date;
    actionType?: string;
  } = {}): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    successRate: number;
    actionTypes: Record<string, number>;
    topActors: Array<{ actor: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
    securityEvents: number;
  }> {
    try {
      const { startDate, endDate, actionType } = options;

      let dateFilter = '';
      const params: any[] = [];

      if (startDate) {
        dateFilter += ` AND timestamp >= $${params.length + 1}`;
        params.push(startDate);
      }

      if (endDate) {
        dateFilter += ` AND timestamp <= $${params.length + 1}`;
        params.push(endDate);
      }

      let actionTypeFilter = '';
      if (actionType) {
        actionTypeFilter = ` AND action_type = $${params.length + 1}`;
        params.push(actionType);
      }

      const whereClause = `WHERE 1=1${dateFilter}${actionTypeFilter}`;

      // Basic statistics
      const stats = await query(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(CASE WHEN success = true THEN 1 END) as successful_actions,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_actions,
          ROUND(COUNT(CASE WHEN success = true THEN 1 END)::float / COUNT(*) * 100, 2) as success_rate
        FROM audit_logs 
        ${whereClause}
      `, params);

      // Action types breakdown
      const actionTypes = await query(`
        SELECT action_type, COUNT(*) as count
        FROM audit_logs 
        ${whereClause}
        GROUP BY action_type
        ORDER BY count DESC
      `, params);

      // Top actors
      const topActors = await query(`
        SELECT actor, COUNT(*) as count
        FROM audit_logs 
        ${whereClause}
        GROUP BY actor
        ORDER BY count DESC
        LIMIT 10
      `, params);

      // Daily activity
      const dailyActivity = await query(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM audit_logs 
        ${whereClause}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `, params);

      // Security events count
      const securityEvents = await query(`
        SELECT COUNT(*) as count
        FROM audit_logs 
        WHERE action_type = 'security_event'${dateFilter}
      `, params.slice(0, startDate ? 1 : 0, endDate ? 1 : 0));

      const actionTypeCounts: Record<string, number> = {};
      actionTypes.forEach(type => {
        actionTypeCounts[type.action_type] = parseInt(type.count);
      });

      return {
        totalLogs: parseInt(stats[0].total_logs),
        successfulActions: parseInt(stats[0].successful_actions),
        failedActions: parseInt(stats[0].failed_actions),
        successRate: parseFloat(stats[0].success_rate) || 0,
        actionTypes: actionTypeCounts,
        topActors: topActors.map(actor => ({
          actor: actor.actor,
          count: parseInt(actor.count),
        })),
        dailyActivity: dailyActivity.map(activity => ({
          date: activity.date.toISOString().split('T')[0],
          count: parseInt(activity.count),
        })),
        securityEvents: parseInt(securityEvents[0].count),
      };
    } catch (error) {
      throw new Error(`Failed to get audit log statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Clean up old audit logs (maintenance function)
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM audit_logs 
         WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
         RETURNING log_id`,
      );

      return result.rowCount || 0;
    } catch (error) {
      throw new Error(`Failed to cleanup old audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Export audit logs (admin function)
  static async exportAuditLogs(options: {
    startDate?: Date;
    endDate?: Date;
    actionType?: string;
    format?: 'json' | 'csv';
  } = {}): Promise<any> {
    try {
      const { startDate, endDate, actionType, format = 'json' } = options;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (startDate) {
        whereClause += ` AND timestamp >= $${params.length + 1}`;
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND timestamp <= $${params.length + 1}`;
        params.push(endDate);
      }

      if (actionType) {
        whereClause += ` AND action_type = $${params.length + 1}`;
        params.push(actionType);
      }

      const logs = await query(`
        SELECT 
          log_id, action_type, actor, target_user_id, details,
          ip_address, user_agent, success, error_message, 
          timestamp, created_at
        FROM audit_logs 
        ${whereClause}
        ORDER BY timestamp DESC
      `, params);

      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['log_id', 'action_type', 'actor', 'target_user_id', 'ip_address', 'user_agent', 'success', 'error_message', 'timestamp'];
        const csvRows = logs.map(log => [
          log.log_id,
          log.action_type,
          log.actor,
          log.target_user_id,
          log.ip_address,
          log.user_agent,
          log.success,
          log.error_message,
          log.timestamp.toISOString(),
        ]);
        
        return [headers, ...csvRows];
      }

      return logs;
    } catch (error) {
      throw new Error(`Failed to export audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default AuditLogService;