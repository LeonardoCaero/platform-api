import type { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import {
  updateUserSchema,
  changePasswordSchema,
  listUsersQuerySchema,
} from '../schemas/users.schema';

const usersService = new UsersService();

export class UsersController {
  /**
   * List all users
   */
  async list(req: Request, res: Response) {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await usersService.list(query);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  }

  /**
   * Get user by ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await usersService.getById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  /**
   * Update user profile
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const data = updateUserSchema.parse(req.body);

    const user = await usersService.update(id, currentUserId, data);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  /**
   * Change user password
   */
  async changePassword(req: Request, res: Response) {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const data = changePasswordSchema.parse(req.body);

    const result = await usersService.changePassword(id, currentUserId, data);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Disable user account
   */
  async disable(req: Request, res: Response) {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    const result = await usersService.disable(id, currentUserId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
}
