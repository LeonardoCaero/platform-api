import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import { assertCompanyPermission, assertMember } from '@/common/utils/membership.util';
import type { CreateCategoryDto, UpdateCategoryDto, ListCategoriesQuery } from '../schemas/categories.schema';

export class CategoriesService {
  /** Create a new time-entry category. If default, unsets the current default first. */
  async create(data: CreateCategoryDto, userId: string, isPlatformAdmin: boolean) {
    await assertCompanyPermission(userId, data.companyId, 'CATEGORY:CREATE', isPlatformAdmin);

    if (data.isDefault) {
      await prisma.timeEntryCategory.updateMany({
        where: { companyId: data.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.timeEntryCategory.create({ data: { ...data, createdBy: userId } });
  }

  /** List all categories for a company, optionally filtered by active status. */
  async list(query: ListCategoriesQuery, userId: string, isPlatformAdmin: boolean) {
    await assertMember(userId, query.companyId, isPlatformAdmin);

    const where: any = { companyId: query.companyId };
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return prisma.timeEntryCategory.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /** Update a category's details. If setting as default, unsets the previous default first. */
  async update(id: string, data: UpdateCategoryDto, userId: string, isPlatformAdmin: boolean) {
    const category = await prisma.timeEntryCategory.findUnique({ where: { id } });
    if (!category) throw ApiError.notFound('Category not found');
    await assertCompanyPermission(userId, category.companyId, 'CATEGORY:EDIT', isPlatformAdmin);

    if (data.isDefault) {
      await prisma.timeEntryCategory.updateMany({
        where: { companyId: category.companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.timeEntryCategory.update({ where: { id }, data });
  }

  /** Delete a category. */
  async delete(id: string, userId: string, isPlatformAdmin: boolean) {
    const category = await prisma.timeEntryCategory.findUnique({ where: { id } });
    if (!category) throw ApiError.notFound('Category not found');
    await assertCompanyPermission(userId, category.companyId, 'CATEGORY:DELETE', isPlatformAdmin);

    await prisma.timeEntryCategory.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
