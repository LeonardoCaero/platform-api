import type { Request, Response } from 'express';
import { CategoriesService } from '../services/categories.service';
import { createCategorySchema, updateCategorySchema, listCategoriesQuerySchema } from '../schemas/categories.schema';

const categoriesService = new CategoriesService();

export class CategoriesController {
  async create(req: Request, res: Response) {
    const data = createCategorySchema.parse(req.body);
    const category = await categoriesService.create(data, req.user!.userId, req.isPlatformAdmin || false);
    res.status(201).json({ success: true, data: category });
  }

  async list(req: Request, res: Response) {
    const query = listCategoriesQuerySchema.parse(req.query);
    const categories = await categoriesService.list(query, req.user!.userId, req.isPlatformAdmin || false);
    res.status(200).json({ success: true, data: categories });
  }

  async update(req: Request, res: Response) {
    const data = updateCategorySchema.parse(req.body);
    const category = await categoriesService.update(req.params.id, data, req.user!.userId, req.isPlatformAdmin || false);
    res.status(200).json({ success: true, data: category });
  }

  async delete(req: Request, res: Response) {
    const result = await categoriesService.delete(req.params.id, req.user!.userId, req.isPlatformAdmin || false);
    res.status(200).json({ success: true, ...result });
  }
}
