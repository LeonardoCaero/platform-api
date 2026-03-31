import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import { assertCompanyPermission, assertMember } from '@/common/utils/membership.util';
import type {
  CreateClientDto,
  UpdateClientDto,
  ListClientsQuery,
  CreateClientSiteDto,
  UpdateClientSiteDto,
  CreateClientRateRuleDto,
  UpdateClientRateRuleDto,
  CreateClientRateRuleResourceDto,
  UpdateClientRateRuleResourceDto,
} from '../schemas/clients.schema';

export class ClientsService {
  // Clients

  /** Create a new client under a company. */
  async create(data: CreateClientDto, userId: string, isPlatformAdmin: boolean) {
    await assertCompanyPermission(userId, data.companyId, 'CLIENT:CREATE', isPlatformAdmin);

    return prisma.client.create({
      data: { ...data, createdBy: userId, updatedBy: userId },
      include: { sites: true, rateRules: true, _count: { select: { timeEntries: true } } },
    });
  }

  /** List clients for a company with pagination, search and active filter. */
  async list(query: ListClientsQuery, userId: string, isPlatformAdmin: boolean) {
    await assertMember(userId, query.companyId, isPlatformAdmin);

    const { page, limit, companyId, isActive, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          sites: { where: { isActive: true }, orderBy: { name: 'asc' } },
          rateRules: {
            where: { isActive: true },
            orderBy: { effectiveFrom: 'desc' },
            include: { resources: { where: { isActive: true }, orderBy: { name: 'asc' } } },
          },
          _count: { select: { timeEntries: true } },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return { clients, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /** Get a client by ID and verify caller has membership in its company. */
  async getById(id: string, userId: string, isPlatformAdmin: boolean) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        sites: { orderBy: { name: 'asc' } },
        rateRules: {
          orderBy: [{ isActive: 'desc' }, { effectiveFrom: 'desc' }],
          include: { resources: { orderBy: { name: 'asc' } } },
        },
        _count: { select: { timeEntries: true } },
      },
    });
    if (!client) throw ApiError.notFound('Client not found');
    await assertMember(userId, client.companyId, isPlatformAdmin);
    return client;
  }

  /** Update a client's details. */
  async update(id: string, data: UpdateClientDto, userId: string, isPlatformAdmin: boolean) {
    const client = await this.getById(id, userId, isPlatformAdmin);
    await assertCompanyPermission(userId, client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    if (data.isDefault === true) {
      return prisma.$transaction(async (tx) => {
        await tx.client.updateMany({ where: { companyId: client.companyId, id: { not: id } }, data: { isDefault: false } });
        return tx.client.update({
          where: { id },
          data: { ...data, updatedBy: userId },
          include: { sites: true, rateRules: true, _count: { select: { timeEntries: true } } },
        });
      });
    }

    return prisma.client.update({
      where: { id },
      data: { ...data, updatedBy: userId },
      include: { sites: true, rateRules: true, _count: { select: { timeEntries: true } } },
    });
  }

  /** Delete a client. */
  async delete(id: string, userId: string, isPlatformAdmin: boolean) {
    const client = await this.getById(id, userId, isPlatformAdmin);
    await assertCompanyPermission(userId, client.companyId, 'CLIENT:DELETE', isPlatformAdmin);

    await prisma.client.delete({ where: { id } });
    return { message: 'Client deleted' };
  }

  // Sites

  /** Create a new site under a client. */
  async createSite(clientId: string, data: CreateClientSiteDto, userId: string, isPlatformAdmin: boolean) {
    const client = await this.getById(clientId, userId, isPlatformAdmin);
    await assertCompanyPermission(userId, client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    return prisma.clientSite.create({ data: { ...data, clientId } });
  }

  /** Update a site's details. */
  async updateSite(siteId: string, data: UpdateClientSiteDto, userId: string, isPlatformAdmin: boolean) {
    const site = await prisma.clientSite.findUnique({ where: { id: siteId }, include: { client: true } });
    if (!site) throw ApiError.notFound('Site not found');
    await assertCompanyPermission(userId, site.client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    if (data.isDefault === true) {
      return prisma.$transaction(async (tx) => {
        await tx.clientSite.updateMany({ where: { clientId: site.clientId, id: { not: siteId } }, data: { isDefault: false } });
        return tx.clientSite.update({ where: { id: siteId }, data });
      });
    }

    return prisma.clientSite.update({ where: { id: siteId }, data });
  }

  /** Delete a site. */
  async deleteSite(siteId: string, userId: string, isPlatformAdmin: boolean) {
    const site = await prisma.clientSite.findUnique({ where: { id: siteId }, include: { client: true } });
    if (!site) throw ApiError.notFound('Site not found');
    await assertCompanyPermission(userId, site.client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    await prisma.clientSite.delete({ where: { id: siteId } });
    return { message: 'Site deleted' };
  }

  // Rate Rules

  /** Create a new rate rule under a client. */
  async createRateRule(clientId: string, data: CreateClientRateRuleDto, userId: string, isPlatformAdmin: boolean) {
    const client = await this.getById(clientId, userId, isPlatformAdmin);
    await assertCompanyPermission(userId, client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    return prisma.clientRateRule.create({
      data: { ...data, baseRatePerHour: data.baseRatePerHour ?? null, clientId, createdBy: userId } as any,
      include: { resources: { orderBy: { name: 'asc' } } },
    });
  }

  /** Update a rate rule's details. */
  async updateRateRule(ruleId: string, data: UpdateClientRateRuleDto, userId: string, isPlatformAdmin: boolean) {
    const rule = await prisma.clientRateRule.findUnique({ where: { id: ruleId }, include: { client: true } });
    if (!rule) throw ApiError.notFound('Rate rule not found');
    await assertCompanyPermission(userId, rule.client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    return prisma.clientRateRule.update({
      where: { id: ruleId },
      data: data as any,
      include: { resources: { orderBy: { name: 'asc' } } },
    });
  }

  /** Delete a rate rule. */
  async deleteRateRule(ruleId: string, userId: string, isPlatformAdmin: boolean) {
    const rule = await prisma.clientRateRule.findUnique({ where: { id: ruleId }, include: { client: true } });
    if (!rule) throw ApiError.notFound('Rate rule not found');
    await assertCompanyPermission(userId, rule.client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    await prisma.clientRateRule.delete({ where: { id: ruleId } });
    return { message: 'Rate rule deleted' };
  }

  // Rate Rule Resources

  /** Create a new resource under a rate rule. */
  async createResource(ruleId: string, data: CreateClientRateRuleResourceDto, userId: string, isPlatformAdmin: boolean) {
    const rule = await prisma.clientRateRule.findUnique({ where: { id: ruleId }, include: { client: true } });
    if (!rule) throw ApiError.notFound('Rate rule not found');
    await assertCompanyPermission(userId, rule.client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    return prisma.clientRateRuleResource.create({ data: { ...data, rateRuleId: ruleId } });
  }

  /** Update a rate rule resource's details. */
  async updateResource(resourceId: string, data: UpdateClientRateRuleResourceDto, userId: string, isPlatformAdmin: boolean) {
    const resource = await prisma.clientRateRuleResource.findUnique({
      where: { id: resourceId },
      include: { rateRule: { include: { client: true } } },
    });
    if (!resource) throw ApiError.notFound('Resource not found');
    await assertCompanyPermission(userId, resource.rateRule.client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    return prisma.clientRateRuleResource.update({ where: { id: resourceId }, data });
  }

  /** Delete a rate rule resource. */
  async deleteResource(resourceId: string, userId: string, isPlatformAdmin: boolean) {
    const resource = await prisma.clientRateRuleResource.findUnique({
      where: { id: resourceId },
      include: { rateRule: { include: { client: true } } },
    });
    if (!resource) throw ApiError.notFound('Resource not found');
    await assertCompanyPermission(userId, resource.rateRule.client.companyId, 'CLIENT:EDIT', isPlatformAdmin);

    await prisma.clientRateRuleResource.delete({ where: { id: resourceId } });
    return { message: 'Resource deleted' };
  }

  /**
   * Resolves whether a time entry is overtime given a clientId and date,
   * and returns the applicable rate. Used internally by time-entries service.
   */
  async resolveOvertimeAndRate(
    clientId: string,
    date: Date,
    startTime?: string | null,
    endTime?: string | null,
    manualOvertime?: boolean,
  ): Promise<{ isOvertime: boolean; appliedRatePerHour: number | null }> {
    const rule = await prisma.clientRateRule.findFirst({
      where: {
        clientId,
        isActive: true,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!rule) return { isOvertime: false, appliedRatePerHour: null };

    const triggers = rule.overtimeTriggers as string[];
    let isOvertime = false;

    if (triggers.includes('MANUAL')) {
      isOvertime = manualOvertime ?? false;
    }

    if (!isOvertime && triggers.includes('WEEKEND')) {
      const day = date.getDay(); // 0=Sun, 6=Sat
      isOvertime = day === 0 || day === 6;
    }

    if (!isOvertime && triggers.includes('AFTER_HOURS') && startTime && rule.workdayStartTime && rule.workdayEndTime) {
      const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const start = toMins(startTime);
      const wStart = toMins(rule.workdayStartTime);
      const wEnd = toMins(rule.workdayEndTime);
      isOvertime = start < wStart || (endTime ? toMins(endTime) > wEnd : false);
    }

    const appliedRatePerHour = isOvertime
      ? Number(rule.overtimeRatePerHour)
      : rule.baseRatePerHour != null ? Number(rule.baseRatePerHour) : null;

    return { isOvertime, appliedRatePerHour };
  }
}
