import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Same permission sets as companies.service.ts
const OWNER_PERMS = [
  'MEMBER:INVITE', 'MEMBER:REMOVE', 'MEMBER:EDIT_ROLE', 'MEMBER:VIEW_LIST', 'MEMBER:VIEW_DETAILS',
  'ROLE:CREATE', 'ROLE:EDIT', 'ROLE:DELETE', 'ROLE:VIEW', 'ROLE:ASSIGN_PERMISSIONS',
  'COMPANY:EDIT_SETTINGS', 'COMPANY:DELETE', 'COMPANY:VIEW_DETAILS', 'COMPANY:VIEW_ANALYTICS', 'COMPANY:EXPORT_DATA',
  'CLIENT:CREATE', 'CLIENT:EDIT', 'CLIENT:DELETE', 'CLIENT:VIEW',
  'CATEGORY:CREATE', 'CATEGORY:EDIT', 'CATEGORY:DELETE', 'CATEGORY:VIEW',
  'TIME:TRACK', 'TIME:EDIT_OWN', 'TIME:EDIT_ALL', 'TIME:VIEW_REPORTS', 'TIME:APPROVE', 'TIME:EXPORT',
  'CALENDAR:CREATE', 'CALENDAR:EDIT_OWN', 'CALENDAR:EDIT_ALL',
];
const ADMIN_PERMS = OWNER_PERMS.filter(k => k !== 'COMPANY:DELETE');
const MANAGER_PERMS = [
  'MEMBER:VIEW_LIST', 'MEMBER:VIEW_DETAILS',
  'ROLE:VIEW',
  'COMPANY:VIEW_DETAILS',
  'CLIENT:VIEW',
  'CATEGORY:VIEW',
  'TIME:TRACK', 'TIME:EDIT_OWN', 'TIME:EDIT_ALL', 'TIME:VIEW_REPORTS',
  'CALENDAR:CREATE', 'CALENDAR:EDIT_OWN', 'CALENDAR:EDIT_ALL',
];
const MEMBER_PERMS = [
  'MEMBER:VIEW_LIST', 'MEMBER:VIEW_DETAILS',
  'ROLE:VIEW',
  'COMPANY:VIEW_DETAILS',
  'CLIENT:VIEW',
  'CATEGORY:VIEW',
  'TIME:TRACK', 'TIME:EDIT_OWN',
  'CALENDAR:CREATE', 'CALENDAR:EDIT_OWN',
];

const ROLE_PERM_MAP: Record<string, string[]> = {
  Owner: OWNER_PERMS,
  Admin: ADMIN_PERMS,
  Manager: MANAGER_PERMS,
  Member: MEMBER_PERMS,
};

async function backfill() {
  console.log('🔄 Starting RolePermission backfill...');

  // Load all COMPANY-scoped permissions
  const allPerms = await prisma.permission.findMany({
    where: { scope: 'COMPANY' },
    select: { id: true, key: true },
  });
  const permByKey = new Map(allPerms.map(p => [p.key, p.id]));

  // Find all system roles (Owner/Admin/Manager/Member) across all companies
  const roles = await prisma.role.findMany({
    where: { isSystem: true, name: { in: ['Owner', 'Admin', 'Manager', 'Member'] } },
    select: { id: true, name: true, companyId: true },
  });

  console.log(`   Found ${roles.length} system roles across all companies`);

  let totalCreated = 0;
  let companiesProcessed = 0;
  const companyIds = [...new Set(roles.map(r => r.companyId))];

  for (const companyId of companyIds) {
    const companyRoles = roles.filter(r => r.companyId === companyId);

    const data: { roleId: string; permissionId: string }[] = [];

    for (const role of companyRoles) {
      const permKeys = ROLE_PERM_MAP[role.name];
      if (!permKeys) continue;

      for (const key of permKeys) {
        const permId = permByKey.get(key);
        if (permId) {
          data.push({ roleId: role.id, permissionId: permId });
        } else {
          console.warn(`   ⚠️  Permission not found: ${key} — run permissions.seed.ts first`);
        }
      }
    }

    if (data.length > 0) {
      const result = await prisma.rolePermission.createMany({ data, skipDuplicates: true });
      totalCreated += result.count;
    }

    companiesProcessed++;
  }

  console.log(`✅ Backfill complete!`);
  console.log(`   Companies processed: ${companiesProcessed}`);
  console.log(`   RolePermission rows created: ${totalCreated}`);
}

backfill()
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
