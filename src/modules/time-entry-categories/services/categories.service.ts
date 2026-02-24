import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import { MembershipStatus } from '@prisma/client';
import type { CreateCategoryDto, UpdateCategoryDto, ListCategoriesQuery } from '../schemas/categories.schema';

async function assertOwnerOrAdmin(userId: string, companyId: string, isPlatformAdmin: boolean) {
  if (isPlatformAdmin) return;
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      companyId,
      status: MembershipStatus.ACTIVE,
      roles: { some: { role: { name: { in: ['Owner', 'Admin'] } } } },
    },
  });
  if (!membership) throw ApiError.forbidden('Only company owners or admins can manage categories');
}

async function assertMember(userId: string, companyId: string, isPlatformAdmin: boolean) {
  if (isPlatformAdmin) return;
  const membership = await prisma.membership.findFirst({
    where: { userId, companyId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) throw ApiError.forbidden('You are not an active member of this company');
}

export class CategoriesService {
  async create(data: CreateCategoryDto, userId: string, isPlatformAdmin: boolean) {
    await assertOwnerOrAdmin(userId, data.companyId, isPlatformAdmin);

    // If creating a default category, unset the current default first
    if (data.isDefault) {
      await prisma.timeEntryCategory.updateMany({
        where: { companyId: data.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.timeEntryCategory.create({ data: { ...data, createdBy: userId } });
  }

  async list(query: ListCategoriesQuery, userId: string, isPlatformAdmin: boolean) {
    await assertMember(userId, query.companyId, isPlatformAdmin);

    const where: any = { companyId: query.companyId };
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return prisma.timeEntryCategory.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async update(id: string, data: UpdateCategoryDto, userId: string, isPlatformAdmin: boolean) {
    const category = await prisma.timeEntryCategory.findUnique({ where: { id } });
    if (!category) throw ApiError.notFound('Category not found');
    await assertOwnerOrAdmin(userId, category.companyId, isPlatformAdmin);

    if (data.isDefault) {
      await prisma.timeEntryCategory.updateMany({
        where: { companyId: category.companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.timeEntryCategory.update({ where: { id }, data });
  }

  async delete(id: string, userId: string, isPlatformAdmin: boolean) {
    const category = await prisma.timeEntryCategory.findUnique({ where: { id } });
    if (!category) throw ApiError.notFound('Category not found');
    await assertOwnerOrAdmin(userId, category.companyId, isPlatformAdmin);

    await prisma.timeEntryCategory.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
