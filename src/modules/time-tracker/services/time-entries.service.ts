import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type { CreateTimeEntryDto, UpdateTimeEntryDto, ListTimeEntriesQuery } from '../schemas/time-entries.schema';
import { MembershipStatus } from '@prisma/client';

export class TimeEntriesService {
  /**
   * Create a new time entry
   */
  async create(data: CreateTimeEntryDto, userId: string) {
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

    // If project specified, verify it belongs to the company
    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          companyId: data.companyId,
        },
      });

      if (!project) {
        throw ApiError.notFound('Project not found in this company');
      }
    }

    // Create the time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...data,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        project: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return timeEntry;
  }

  /**
   * List time entries with filters
   */
  async list(query: ListTimeEntriesQuery, userId: string, isPlatformAdmin: boolean) {
    const { page, limit, companyId, projectId, userId: filterUserId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // If not platform admin, only show entries from companies user belongs to
    if (!isPlatformAdmin) {
      const userMemberships = await prisma.membership.findMany({
        where: { userId, status: MembershipStatus.ACTIVE },
        select: { companyId: true },
      });

      const companyIds = userMemberships.map(m => m.companyId);

      if (companyId) {
        if (!companyIds.includes(companyId)) {
          throw ApiError.forbidden('You do not have access to this company');
        }
        where.companyId = companyId;
      } else {
        where.companyId = { in: companyIds };
      }
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (projectId) where.projectId = projectId;
    if (filterUserId) where.userId = filterUserId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    // Execute query
    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          project: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.timeEntry.count({ where }),
    ]);

    return {
      timeEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get time entry by ID
   */
  async getById(id: string, userId: string, isPlatformAdmin: boolean) {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        project: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!timeEntry) {
      throw ApiError.notFound('Time entry not found');
    }

    // Check access
    if (!isPlatformAdmin && timeEntry.userId !== userId) {
      // Check if user is member of the company
      const membership = await prisma.membership.findFirst({
        where: {
          userId,
          companyId: timeEntry.companyId,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (!membership) {
        throw ApiError.forbidden('You do not have access to this time entry');
      }
    }

    return timeEntry;
  }

  /**
   * Update time entry
   */
  async update(id: string, data: UpdateTimeEntryDto, userId: string, isPlatformAdmin: boolean) {
    const timeEntry = await this.getById(id, userId, isPlatformAdmin);

    // Only owner can edit their own entries (unless platform admin)
    if (!isPlatformAdmin && timeEntry.userId !== userId) {
      throw ApiError.forbidden('You can only edit your own time entries');
    }

    // If project is being updated, verify it belongs to the company
    if (data.projectId !== undefined && data.projectId !== null) {
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          companyId: timeEntry.companyId,
        },
      });

      if (!project) {
        throw ApiError.notFound('Project not found in this company');
      }
    }

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        project: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return updatedTimeEntry;
  }

  /**
   * Delete time entry
   */
  async delete(id: string, userId: string, isPlatformAdmin: boolean) {
    const timeEntry = await this.getById(id, userId, isPlatformAdmin);

    // Only owner can delete their own entries (unless platform admin)
    if (!isPlatformAdmin && timeEntry.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own time entries');
    }

    await prisma.timeEntry.delete({
      where: { id },
    });

    return { message: 'Time entry deleted successfully' };
  }

  /**
   * Get time summary for a user in a date range
   */
  async getSummary(companyId: string, userId: string, startDate: Date, endDate: Date) {
    // Verify user is member of company
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        companyId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw ApiError.forbidden('You are not a member of this company');
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: true,
      },
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

    // Group by project
    const byProject = timeEntries.reduce((acc, entry) => {
      const projectId = entry.projectId || 'no-project';
      const projectName = entry.project?.name || 'No Project';

      if (!acc[projectId]) {
        acc[projectId] = {
          projectId: entry.projectId,
          projectName,
          hours: 0,
          entries: 0,
        };
      }

      acc[projectId].hours += Number(entry.hours);
      acc[projectId].entries += 1;

      return acc;
    }, {} as Record<string, any>);

    return {
      totalHours,
      totalEntries: timeEntries.length,
      byProject: Object.values(byProject),
      startDate,
      endDate,
    };
  }
}
