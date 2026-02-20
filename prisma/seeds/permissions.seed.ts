import { PrismaClient, PermissionScope } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed base permissions
 * Run with: npx tsx prisma/seeds/permissions.seed.ts
 */

const BASE_PERMISSIONS = [
  // ==========================================
  // PLATFORM PERMISSIONS (Global Scope)
  // ==========================================
  {
    key: 'PLATFORM:MANAGE_USERS',
    description: 'Manage all platform users',
    scope: PermissionScope.GLOBAL,
  },
  {
    key: 'PLATFORM:MANAGE_PERMISSIONS',
    description: 'Manage platform permissions catalog',
    scope: PermissionScope.GLOBAL,
  },
  {
    key: 'PLATFORM:VIEW_ANALYTICS',
    description: 'View platform-wide analytics',
    scope: PermissionScope.GLOBAL,
  },
  {
    key: 'PLATFORM:MANAGE_SETTINGS',
    description: 'Manage platform settings',
    scope: PermissionScope.GLOBAL,
  },

  // ==========================================
  // COMPANY PERMISSIONS (Company/Global Scope)
  // ==========================================
  {
    key: 'COMPANY:CREATE',
    description: 'Create new companies',
    scope: PermissionScope.GLOBAL, // Global because it's platform-wide
  },
  {
    key: 'COMPANY:EDIT_SETTINGS',
    description: 'Edit company settings',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'COMPANY:DELETE',
    description: 'Delete companies',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'COMPANY:VIEW_DETAILS',
    description: 'View company details',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'COMPANY:VIEW_ANALYTICS',
    description: 'View company analytics',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'COMPANY:EXPORT_DATA',
    description: 'Export company data',
    scope: PermissionScope.COMPANY,
  },

  // ==========================================
  // MEMBER MANAGEMENT
  // ==========================================
  {
    key: 'MEMBER:INVITE',
    description: 'Invite members to company',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'MEMBER:REMOVE',
    description: 'Remove members from company',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'MEMBER:EDIT_ROLE',
    description: 'Edit member roles',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'MEMBER:VIEW_LIST',
    description: 'View members list',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'MEMBER:VIEW_DETAILS',
    description: 'View member details',
    scope: PermissionScope.COMPANY,
  },

  // ==========================================
  // ROLE MANAGEMENT
  // ==========================================
  {
    key: 'ROLE:CREATE',
    description: 'Create new roles',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'ROLE:EDIT',
    description: 'Edit existing roles',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'ROLE:DELETE',
    description: 'Delete roles',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'ROLE:VIEW',
    description: 'View roles',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'ROLE:ASSIGN_PERMISSIONS',
    description: 'Assign permissions to roles',
    scope: PermissionScope.COMPANY,
  },

  // ==========================================
  // INVOICE MANAGEMENT (Example future module)
  // ==========================================
  {
    key: 'INVOICE:CREATE',
    description: 'Create invoices',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'INVOICE:EDIT',
    description: 'Edit invoices',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'INVOICE:DELETE',
    description: 'Delete invoices',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'INVOICE:VIEW',
    description: 'View invoices',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'INVOICE:APPROVE',
    description: 'Approve invoices',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'INVOICE:EXPORT',
    description: 'Export invoice data',
    scope: PermissionScope.COMPANY,
  },

  // ==========================================
  // REPORT MANAGEMENT
  // ==========================================
  {
    key: 'REPORT:CREATE',
    description: 'Create reports',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'REPORT:EDIT',
    description: 'Edit reports',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'REPORT:DELETE',
    description: 'Delete reports',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'REPORT:VIEW',
    description: 'View reports',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'REPORT:EXPORT',
    description: 'Export reports',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'REPORT:SCHEDULE',
    description: 'Schedule automated reports',
    scope: PermissionScope.COMPANY,
  },

  // ==========================================
  // TIME TRACKING
  // ==========================================
  {
    key: 'TIME:TRACK',
    description: 'Track time entries',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'TIME:EDIT_OWN',
    description: 'Edit own time entries',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'TIME:EDIT_ALL',
    description: 'Edit all time entries',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'TIME:APPROVE',
    description: 'Approve time entries',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'TIME:VIEW_REPORTS',
    description: 'View time tracking reports',
    scope: PermissionScope.COMPANY,
  },
  {
    key: 'TIME:EXPORT',
    description: 'Export time tracking data',
    scope: PermissionScope.COMPANY,
  },
];

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  let created = 0;
  let updated = 0;

  for (const permission of BASE_PERMISSIONS) {
    const result = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        description: permission.description,
        scope: permission.scope,
      },
      create: permission,
    });

    if (result) {
      const existing = await prisma.permission.findUnique({
        where: { key: permission.key },
      });
      
      if (existing?.id === result.id) {
        created++;
      } else {
        updated++;
      }
    }
  }

  console.log(`✅ Permissions seeded successfully!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Total: ${BASE_PERMISSIONS.length}`);
}

seedPermissions()
  .catch((error) => {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
