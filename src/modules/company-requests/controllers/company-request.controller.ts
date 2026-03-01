import type { Request, Response } from 'express';
import { companyRequestService } from '../services/company-request.service';
import {
  createCompanyRequestSchema,
  listCompanyRequestsSchema,
  reviewCompanyRequestSchema,
  updateCompanyRequestSchema,
} from '../schemas/company-request.schema';

export class CompanyRequestController {
  /**
   * POST /api/company-requests
   * Create a new company request
   */
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const dto = createCompanyRequestSchema.parse(req.body);

    const companyRequest = await companyRequestService.create(userId, dto);

    res.status(201).json({
      success: true,
      data: companyRequest,
      message: 'Company request submitted successfully. An admin will review it soon.',
    });
  }

  /**
   * GET /api/company-requests
   * Get user's own requests
   */
  async getUserRequests(req: Request, res: Response) {
    const userId = req.user!.userId;
    const dto = listCompanyRequestsSchema.parse(req.query);

    const result = await companyRequestService.getUserRequests(userId, dto);

    res.json({
      success: true,
      ...result,
    });
  }

  /**
   * GET /api/admin/company-requests
   * Get all requests (admin only)
   */
  async getAllRequests(req: Request, res: Response) {
    const dto = listCompanyRequestsSchema.parse(req.query);

    const result = await companyRequestService.getAllRequests(dto);

    res.json({
      success: true,
      ...result,
    });
  }

  /**
   * GET /api/company-requests/:id
   * Get request by ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const isPlatformAdmin = req.isPlatformAdmin ?? false;
    const userId = !isPlatformAdmin ? req.user!.userId : undefined;

    const request = await companyRequestService.getById(id, userId);

    res.json({
      success: true,
      data: request,
    });
  }

  /**
   * PATCH /api/company-requests/:id
   * Update pending request (user only)
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const dto = updateCompanyRequestSchema.parse(req.body);

    const updated = await companyRequestService.update(id, userId, dto);

    res.json({
      success: true,
      data: updated,
      message: 'Company request updated successfully',
    });
  }

  /**
   * POST /api/company-requests/:id/cancel
   * Cancel pending request (user only)
   */
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const cancelled = await companyRequestService.cancel(id, userId);

    res.json({
      success: true,
      data: cancelled,
      message: 'Company request cancelled',
    });
  }

  /**
   * POST /api/admin/company-requests/:id/review
   * Approve or reject request (admin only)
   */
  async review(req: Request, res: Response) {
    const { id } = req.params;
    const reviewerId = req.user!.userId;
    const dto = reviewCompanyRequestSchema.parse(req.body);

    const reviewed = await companyRequestService.review(id, reviewerId, dto);

    const message = dto.action === 'approve' 
      ? 'Company request approved. User can now create their company.' 
      : 'Company request rejected.';

    res.json({
      success: true,
      data: reviewed,
      message,
    });
  }
}
