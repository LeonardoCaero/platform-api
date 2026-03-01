import type { Request, Response } from 'express';
import { permissionRequestService } from '../services/permission-request.service';
import {
  createPermissionRequestSchema,
  listPermissionRequestsSchema,
  reviewPermissionRequestSchema,
  updatePermissionRequestSchema,
} from '../schemas/permission-request.schema';

export class PermissionRequestController {
  /**
   * GET /api/permission-requests/available-permissions
   * Get available global permissions
   */
  async getAvailablePermissions(req: Request, res: Response) {
    const permissions = await permissionRequestService.getAvailablePermissions();

    res.json({
      success: true,
      data: permissions,
    });
  }

  /**
   * POST /api/permission-requests
   * Create a new permission request
   */
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const dto = createPermissionRequestSchema.parse(req.body);

    const permissionRequest = await permissionRequestService.create(userId, dto);

    res.status(201).json({
      success: true,
      data: permissionRequest,
      message: 'Permission request submitted successfully. An admin will review it soon.',
    });
  }

  /**
   * GET /api/permission-requests
   * Get user's own requests
   */
  async getUserRequests(req: Request, res: Response) {
    const userId = req.user!.userId;
    const dto = listPermissionRequestsSchema.parse(req.query);

    const result = await permissionRequestService.getUserRequests(userId, dto);

    res.json({
      success: true,
      ...result,
    });
  }

  /**
   * GET /api/permission-requests/admin/all
   * Get all requests (admin only)
   */
  async getAllRequests(req: Request, res: Response) {
    const dto = listPermissionRequestsSchema.parse(req.query);

    const result = await permissionRequestService.getAllRequests(dto);

    res.json({
      success: true,
      ...result,
    });
  }

  /**
   * GET /api/permission-requests/:id
   * Get request by ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const isPlatformAdmin = req.isPlatformAdmin ?? false;
    const userId = !isPlatformAdmin ? req.user!.userId : undefined;

    const request = await permissionRequestService.getById(id, userId);

    res.json({
      success: true,
      data: request,
    });
  }

  /**
   * PATCH /api/permission-requests/:id
   * Update pending request (user only)
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const dto = updatePermissionRequestSchema.parse(req.body);

    const updated = await permissionRequestService.update(id, userId, dto);

    res.json({
      success: true,
      data: updated,
      message: 'Permission request updated successfully',
    });
  }

  /**
   * POST /api/permission-requests/:id/cancel
   * Cancel pending request (user only)
   */
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const cancelled = await permissionRequestService.cancel(id, userId);

    res.json({
      success: true,
      data: cancelled,
      message: 'Permission request cancelled',
    });
  }

  /**
   * POST /api/permission-requests/admin/:id/review
   * Approve or reject request (admin only)
   */
  async review(req: Request, res: Response) {
    const { id } = req.params;
    const reviewerId = req.user!.userId;
    const dto = reviewPermissionRequestSchema.parse(req.body);

    const reviewed = await permissionRequestService.review(id, reviewerId, dto);

    const message =
      dto.action === 'approve'
        ? 'Permission request approved and permission granted to user.'
        : 'Permission request rejected.';

    res.json({
      success: true,
      data: reviewed,
      message,
    });
  }
}
