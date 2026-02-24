import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import { sseManager } from '@/common/services/sse.manager';
import type { CreateTimeEntryDto, UpdateTimeEntryDto, ListTimeEntriesQuery } from '../schemas/time-entries.schema';
import { MembershipStatus } from '@prisma/client';
import { ClientsService } from '@/modules/clients/services/clients.service';

const clientsService = new ClientsService();

// ─── includes reused across queries ─────────────────────────────────────────
const ENTRY_INCLUDE = {
  user: { select: { id: true, fullName: true, email: true, avatar: true } },
  project: true,
  company: { select: { id: true, name: true, slug: true } },
  client: { select: { id: true, name: true } },
  clientSite: { select: { id: true, name: true, city: true } },
  category: { select: { id: true, name: true, color: true } },
  loggedByUser: {
    select: { id: true, fullName: true, avatar: true },
  },
} as const;

export class TimeEntriesService {
  /**
   * Returns the user IDs that should receive a real-time time-entry notification:
   * company owners + platform admins, excluding the user who triggered the action.
   */
  private async getNotifiableUserIds(companyId: string, excludeUserId: string): Promise<string[]> {
    const [ownerMemberships, platformAdmins] = await Promise.all([
      // Members of this company whose role is 'Owner'
      prisma.membership.findMany({
        where: {
          companyId,
          status: MembershipStatus.ACTIVE,
          roles: { some: { role: { name: 'Owner' } } },
        },
        select: { userId: true },
      }),
      // All platform admins
      prisma.platformAdmin.findMany({ select: { userId: true } }),
    ]);

    const ids = new Set<string>();
    for (const m of ownerMemberships) ids.add(m.userId);
    for (const a of platformAdmins) ids.add(a.userId);
    ids.delete(excludeUserId);
    return [...ids];
  }

  /** Check that userId is an owner/admin of the given company */
  private async isOwnerOrAdmin(userId: string, companyId: string, isPlatformAdmin: boolean): Promise<boolean> {
    if (isPlatformAdmin) return true;
    const m = await prisma.membership.findFirst({
      where: {
        userId,
        companyId,
        status: MembershipStatus.ACTIVE,
        roles: { some: { role: { name: { in: ['Owner', 'Admin'] } } } },
      },
    });
    return !!m;
  }

  /**
   * Create a new time entry
   */
  async create(data: CreateTimeEntryDto, callerId: string, isPlatformAdmin: boolean) {
    const { targetUserId, isOvertime: manualOvertime, clientId, ...rest } = data;

    // Determine the actual owner of the entry
    let entryUserId = callerId;
    let loggedByUserId: string | null = null;

    if (targetUserId && targetUserId !== callerId) {
      // Only owner/admin can log for someone else
      const canManage = await this.isOwnerOrAdmin(callerId, data.companyId, isPlatformAdmin);
      if (!canManage) {
        throw ApiError.forbidden('Only company owners or admins can log hours for other members');
      }
      // Verify target is an active member
      const targetMembership = await prisma.membership.findFirst({
        where: { userId: targetUserId, companyId: data.companyId, status: MembershipStatus.ACTIVE },
      });
      if (!targetMembership) {
        throw ApiError.badRequest('Target user is not an active member of this company');
      }
      entryUserId = targetUserId;
      loggedByUserId = callerId;
    } else {
      // Caller must be an active member
      const membership = await prisma.membership.findFirst({
        where: { userId: callerId, companyId: data.companyId, status: MembershipStatus.ACTIVE },
      });
      if (!membership) {
        throw ApiError.forbidden('You are not an active member of this company');
      }
    }

    // If project specified, verify it belongs to the company
    if (rest.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: rest.projectId, companyId: data.companyId },
      });
      if (!project) throw ApiError.notFound('Project not found in this company');
    }

    // Resolve overtime & rate from client rule
    let isOvertime = manualOvertime ?? false;
    let appliedRatePerHour: number | null = null;

    if (clientId) {
      const resolved = await clientsService.resolveOvertimeAndRate(
        clientId,
        rest.date,
        rest.startTime,
        rest.endTime,
        manualOvertime,
      );
      isOvertime = resolved.isOvertime;
      appliedRatePerHour = resolved.appliedRatePerHour;
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...rest,
        clientId: clientId ?? null,
        userId: entryUserId,
        loggedByUserId,
        isOvertime,
        appliedRatePerHour,
      },
      include: ENTRY_INCLUDE,
    });

    // Notify owners + platform admins
    const notifyIds = await this.getNotifiableUserIds(timeEntry.companyId, callerId);
    sseManager.sendToUsers(notifyIds, 'time-entry:change', {
      action: 'created',
      companyId: timeEntry.companyId,
      companyName: timeEntry.company.name,
      userName: timeEntry.user.fullName,
      hours: Number(timeEntry.hours),
      projectName: timeEntry.project?.name ?? null,
      date: timeEntry.date,
    });

    return timeEntry;
  }

  /**
   * List time entries with filters
   */
  async list(query: ListTimeEntriesQuery, userId: string, isPlatformAdmin: boolean) {
    const { page, limit, companyId, projectId, userId: filterUserId, clientId, categoryId, isOvertime, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

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
    if (clientId) where.clientId = clientId;
    if (categoryId) where.categoryId = categoryId;
    if (isOvertime !== undefined) where.isOvertime = isOvertime;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: ENTRY_INCLUDE,
      }),
      prisma.timeEntry.count({ where }),
    ]);

    return { timeEntries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Get time entry by ID
   */
  async getById(id: string, userId: string, isPlatformAdmin: boolean) {
    const timeEntry = await prisma.timeEntry.findUnique({ where: { id }, include: ENTRY_INCLUDE });

    if (!timeEntry) throw ApiError.notFound('Time entry not found');

    if (!isPlatformAdmin && timeEntry.userId !== userId) {
      const membership = await prisma.membership.findFirst({
        where: { userId, companyId: timeEntry.companyId, status: MembershipStatus.ACTIVE },
      });
      if (!membership) throw ApiError.forbidden('You do not have access to this time entry');
    }

    return timeEntry;
  }

  /**
   * Update time entry
   */
  async update(id: string, data: UpdateTimeEntryDto, userId: string, isPlatformAdmin: boolean) {
    const timeEntry = await this.getById(id, userId, isPlatformAdmin);

    if (!isPlatformAdmin && timeEntry.userId !== userId) {
      // Allow owner/admin to edit any entry in their company
      const canManage = await this.isOwnerOrAdmin(userId, timeEntry.companyId, isPlatformAdmin);
      if (!canManage) throw ApiError.forbidden('You can only edit your own time entries');
    }

    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, companyId: timeEntry.companyId },
      });
      if (!project) throw ApiError.notFound('Project not found in this company');
    }

    // Re-resolve overtime when client or time changes
    let isOvertime = data.isOvertime ?? timeEntry.isOvertime;
    let appliedRatePerHour = timeEntry.appliedRatePerHour ? Number(timeEntry.appliedRatePerHour) : null;
    const effectiveClientId = data.clientId !== undefined ? data.clientId : timeEntry.clientId;

    if (effectiveClientId && (data.clientId !== undefined || data.startTime !== undefined || data.endTime !== undefined || data.date !== undefined || data.isOvertime !== undefined)) {
      const resolved = await clientsService.resolveOvertimeAndRate(
        effectiveClientId,
        data.date ?? timeEntry.date,
        data.startTime !== undefined ? data.startTime : timeEntry.startTime,
        data.endTime !== undefined ? data.endTime : timeEntry.endTime,
        data.isOvertime,
      );
      isOvertime = resolved.isOvertime;
      appliedRatePerHour = resolved.appliedRatePerHour;
    }

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id },
      data: { ...data, isOvertime, appliedRatePerHour },
      include: ENTRY_INCLUDE,
    });

    const notifyIds = await this.getNotifiableUserIds(updatedTimeEntry.companyId, userId);
    sseManager.sendToUsers(notifyIds, 'time-entry:change', {
      action: 'updated',
      companyId: updatedTimeEntry.companyId,
      companyName: updatedTimeEntry.company.name,
      userName: updatedTimeEntry.user.fullName,
      hours: Number(updatedTimeEntry.hours),
      projectName: updatedTimeEntry.project?.name ?? null,
      date: updatedTimeEntry.date,
    });

    return updatedTimeEntry;
  }

  /**
   * Delete time entry
   */
  async delete(id: string, userId: string, isPlatformAdmin: boolean) {
    const timeEntry = await this.getById(id, userId, isPlatformAdmin);

    if (!isPlatformAdmin && timeEntry.userId !== userId) {
      const canManage = await this.isOwnerOrAdmin(userId, timeEntry.companyId, isPlatformAdmin);
      if (!canManage) throw ApiError.forbidden('You do not have permission to delete this entry');
    }

    await prisma.timeEntry.delete({ where: { id } });

    const notifyIds = await this.getNotifiableUserIds(timeEntry.companyId, userId);
    sseManager.sendToUsers(notifyIds, 'time-entry:change', { action: 'deleted', companyId: timeEntry.companyId });

    return { message: 'Time entry deleted successfully' };
  }

  /**
   * Get time summary for a user in a date range
   */
  async getSummary(companyId: string, userId: string, startDate: Date, endDate: Date) {
    const membership = await prisma.membership.findFirst({
      where: { userId, companyId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw ApiError.forbidden('You are not a member of this company');

    const timeEntries = await prisma.timeEntry.findMany({
      where: { userId, companyId, date: { gte: startDate, lte: endDate } },
      include: { project: true },
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

    const byProject = timeEntries.reduce((acc, entry) => {
      const projectId = entry.projectId || 'no-project';
      const projectName = entry.project?.name || 'No Project';
      if (!acc[projectId]) acc[projectId] = { projectId: entry.projectId, projectName, hours: 0, entries: 0 };
      acc[projectId].hours += Number(entry.hours);
      acc[projectId].entries += 1;
      return acc;
    }, {} as Record<string, any>);

    return { totalHours, totalEntries: timeEntries.length, byProject: Object.values(byProject), startDate, endDate };
  }
}


