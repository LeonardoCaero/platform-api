import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type { CreateProjectDto, UpdateProjectDto, ListProjectsQuery } from '../schemas/projects.schema';
import { MembershipStatus } from '@prisma/client';

export class ProjectsService {
  /**
   * Create a new project
   */
  async create(data: CreateProjectDto, userId: string) {
    // Verify user is an active member of the company
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        companyId: data.companyId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw ApiError.forbidden('You are not an active member of this company');
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * List projects with filters
   */
  async list(query: ListProjectsQuery, userId: string, isPlatformAdmin: boolean) {
    const { page, limit, companyId, isActive, search } = query;
    const skip = (page - 1) * limit;

    // Verify user has access to this company
    if (!isPlatformAdmin) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId,
          companyId,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (!membership) {
        throw ApiError.forbidden('You do not have access to this company');
      }
    }

    // Build where clause
    const where: any = { companyId };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              timeEntries: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get project by ID
   */
  async getById(id: string, userId: string, isPlatformAdmin: boolean) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check access
    if (!isPlatformAdmin) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId,
          companyId: project.companyId,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (!membership) {
        throw ApiError.forbidden('You do not have access to this project');
      }
    }

    return project;
  }

  /**
   * Update project
   */
  async update(id: string, data: UpdateProjectDto, userId: string, isPlatformAdmin: boolean) {
    const project = await this.getById(id, userId, isPlatformAdmin);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    });

    return updatedProject;
  }

  /**
   * Delete project
   */
  async delete(id: string, userId: string, isPlatformAdmin: boolean) {
    const project = await this.getById(id, userId, isPlatformAdmin);

    // Check if project has time entries
    const timeEntriesCount = await prisma.timeEntry.count({
      where: { projectId: id },
    });

    if (timeEntriesCount > 0) {
      throw ApiError.conflict('Cannot delete project with existing time entries');
    }

    await prisma.project.delete({
      where: { id },
    });

    return { message: 'Project deleted successfully' };
  }
}
