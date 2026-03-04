import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import { MembershipStatus } from '@prisma/client';
import { assertOwnerOrAdmin, assertMember, isOwnerOrAdmin } from '@/common/utils/membership.util';
import type {
  CreateCalendarNoteDto,
  UpdateCalendarNoteDto,
  ListCalendarNotesQuery,
} from '../schemas/calendar-notes.schema';

const NOTE_INCLUDE = {
  createdBy: {
    select: { id: true, fullName: true, email: true, avatar: true },
  },
  assignees: {
    include: {
      user: { select: { id: true, fullName: true, email: true, avatar: true } },
    },
  },
} as const;

export class CalendarNotesService {
  async create(data: CreateCalendarNoteDto, callerId: string, isPlatformAdmin: boolean) {
    await assertMember(callerId, data.companyId, isPlatformAdmin);

    const elevated = await isOwnerOrAdmin(callerId, data.companyId, isPlatformAdmin);

    const { assigneeUserIds: rawAssigneeIds, ...rest } = data;

    // Regular members can only assign to themselves
    const assigneeUserIds = elevated ? (rawAssigneeIds ?? []) : [callerId];

    // Validate all assignees are active members of the company
    if (assigneeUserIds.length > 0) {
      const memberships = await prisma.membership.findMany({
        where: {
          companyId: data.companyId,
          status: MembershipStatus.ACTIVE,
          userId: { in: assigneeUserIds },
        },
        select: { userId: true },
      });
      const foundIds = new Set(memberships.map(m => m.userId));
      const missing = assigneeUserIds.filter(id => !foundIds.has(id));
      if (missing.length > 0) {
        throw ApiError.badRequest(`Some assignees are not active members of this company`);
      }
    }

    const note = await prisma.calendarNote.create({
      data: {
        ...rest,
        createdByUserId: callerId,
        assignees:
          assigneeUserIds.length > 0
            ? { create: assigneeUserIds.map(userId => ({ userId })) }
            : undefined,
      },
      include: NOTE_INCLUDE,
    });
    return note;
  }

  async list(query: ListCalendarNotesQuery, callerId: string, isPlatformAdmin: boolean) {
    await assertMember(callerId, query.companyId, isPlatformAdmin);

    const notes = await prisma.calendarNote.findMany({
      where: {
        companyId: query.companyId,
        date: { gte: query.startDate, lte: query.endDate },
      },
      include: NOTE_INCLUDE,
      orderBy: { date: 'asc' },
    });
    return notes;
  }

  async getById(id: string, callerId: string, isPlatformAdmin: boolean) {
    const note = await prisma.calendarNote.findUnique({
      where: { id },
      include: NOTE_INCLUDE,
    });
    if (!note) throw ApiError.notFound('Calendar note not found');
    await assertMember(callerId, note.companyId, isPlatformAdmin);
    return note;
  }

  async update(id: string, data: UpdateCalendarNoteDto, callerId: string, isPlatformAdmin: boolean) {
    const existing = await prisma.calendarNote.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Calendar note not found');

    const elevated = await isOwnerOrAdmin(callerId, existing.companyId, isPlatformAdmin);

    // Allow if elevated (owner/admin/platform admin) or the creator of the note
    if (!elevated && existing.createdByUserId !== callerId) {
      throw ApiError.forbidden('You can only edit your own notes');
    }

    const { assigneeUserIds: rawAssigneeIds, ...rest } = data;

    // Regular members can only assign to themselves
    const assigneeUserIds = rawAssigneeIds !== undefined
      ? (elevated ? rawAssigneeIds : [callerId])
      : undefined;

    // If assigneeUserIds provided, validate and replace all assignees
    if (assigneeUserIds !== undefined) {
      if (assigneeUserIds.length > 0) {
        const memberships = await prisma.membership.findMany({
          where: {
            companyId: existing.companyId,
            status: MembershipStatus.ACTIVE,
            userId: { in: assigneeUserIds },
          },
          select: { userId: true },
        });
        const foundIds = new Set(memberships.map(m => m.userId));
        const missing = assigneeUserIds.filter(uid => !foundIds.has(uid));
        if (missing.length > 0) {
          throw ApiError.badRequest('Some assignees are not active members of this company');
        }
      }
      // Replace assignees
      await prisma.calendarNoteAssignee.deleteMany({ where: { calendarNoteId: id } });
      if (assigneeUserIds.length > 0) {
        await prisma.calendarNoteAssignee.createMany({
          data: assigneeUserIds.map(userId => ({ calendarNoteId: id, userId })),
        });
      }
    }

    const note = await prisma.calendarNote.update({
      where: { id },
      data: rest,
      include: NOTE_INCLUDE,
    });
    return note;
  }

  async delete(id: string, callerId: string, isPlatformAdmin: boolean) {
    const existing = await prisma.calendarNote.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Calendar note not found');

    const elevated = await isOwnerOrAdmin(callerId, existing.companyId, isPlatformAdmin);

    // Allow if elevated (owner/admin/platform admin) or the creator of the note
    if (!elevated && existing.createdByUserId !== callerId) {
      throw ApiError.forbidden('You can only delete your own notes');
    }

    await prisma.calendarNote.delete({ where: { id } });
    return { message: 'Calendar note deleted successfully' };
  }
}
