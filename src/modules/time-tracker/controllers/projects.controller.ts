import type { Request, Response } from 'express';
import { ProjectsService } from '../services/projects.service';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} from '../schemas/projects.schema';

const projectsService = new ProjectsService();

export class ProjectsController {
  /**
   * Create a new project
   */
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const data = createProjectSchema.parse(req.body);

    const project = await projectsService.create(data, userId);

    res.status(201).json({
      success: true,
      data: project,
    });
  }

  /**
   * List projects with filters
   */
  async list(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const query = listProjectsQuerySchema.parse(req.query);

    const result = await projectsService.list(query, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      data: result.projects,
      pagination: result.pagination,
    });
  }

  /**
   * Get project by ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;

    const project = await projectsService.getById(id, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      data: project,
    });
  }

  /**
   * Update project
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = updateProjectSchema.parse(req.body);

    const project = await projectsService.update(id, data, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      data: project,
    });
  }

  /**
   * Delete project
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;

    const result = await projectsService.delete(id, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
}
