import type { Request, Response } from 'express';
import { CompaniesService } from '../services/companies.service';
import {
  createCompanySchema,
  updateCompanySchema,
  listCompaniesQuerySchema,
} from '../schemas/companies.schema';

const companiesService = new CompaniesService();

export class CompaniesController {
  /**
   * Create a new company
   */
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const data = createCompanySchema.parse(req.body);

    const company = await companiesService.create(data, userId);

    res.status(201).json({
      success: true,
      data: company,
    });
  }

  /**
   * List all companies
   */
  async list(req: Request, res: Response) {
    const query = listCompaniesQuerySchema.parse(req.query);
    const result = await companiesService.list(query);

    res.status(200).json({
      success: true,
      data: result.companies,
      pagination: result.pagination,
    });
  }

  /**
   * Get company by ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const company = await companiesService.getById(id);

    res.status(200).json({
      success: true,
      data: company,
    });
  }

  /**
   * Get company by slug
   */
  async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const company = await companiesService.getBySlug(slug);

    res.status(200).json({
      success: true,
      data: company,
    });
  }

  /**
   * Update company
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const data = updateCompanySchema.parse(req.body);

    const company = await companiesService.update(id, data, userId);

    res.status(200).json({
      success: true,
      data: company,
    });
  }

  /**
   * Soft delete company
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await companiesService.delete(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Restore deleted company
   */
  async restore(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const company = await companiesService.restore(id, userId);

    res.status(200).json({
      success: true,
      data: company,
    });
  }
}
