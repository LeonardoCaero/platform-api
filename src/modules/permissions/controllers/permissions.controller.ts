import type { Request, Response } from 'express';
import { PermissionsService } from '../services/permissions.service';
import {
  createPermissionSchema,
  updatePermissionSchema,
  listPermissionsQuerySchema,
} from '../schemas/permissions.schema';

const permissionsService = new PermissionsService();

export class PermissionsController {
  /**
   * Create a new permission
   */
  async create(req: Request, res: Response) {
    const data = createPermissionSchema.parse(req.body);
    const permission = await permissionsService.create(data);

    res.status(201).json({
      success: true,
      data: permission,
    });
  }

  /**
   * List all permissions
   */
  async list(req: Request, res: Response) {
    const query = listPermissionsQuerySchema.parse(req.query);
    const result = await permissionsService.list(query);

    res.status(200).json({
      success: true,
      data: result.permissions,
      pagination: result.pagination,
    });
  }

  /**
   * Get permission by ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const permission = await permissionsService.getById(id);

    res.status(200).json({
      success: true,
      data: permission,
    });
  }

  /**
   * Update permission
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = updatePermissionSchema.parse(req.body);
    const permission = await permissionsService.update(id, data);

    res.status(200).json({
      success: true,
      data: permission,
    });
  }

  /**
   * Delete permission
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const result = await permissionsService.delete(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Get all permissions (no pagination)
   */
  async getAll(req: Request, res: Response) {
    const permissions = await permissionsService.getAll();

    res.status(200).json({
      success: true,
      data: permissions,
    });
  }
}
