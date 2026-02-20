import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db/prisma";
import { env } from "prisma/config";

async function main() {
  console.log("🌱 Seeding database (clean)...");

  // ---- 1) PLATFORM ADMIN (SUPER ADMIN) ----
  const adminEmail = env("SEED_ADMIN_EMAIL");
  const adminPassword = env("SEED_ADMIN_PASSWORD");
  const adminFullName = env("SEED_ADMIN_FULLNAME");

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: adminFullName,
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        platformAdmin: {
          create: {},
        },
      },
    });

    console.log("✅ Platform admin created:", adminUser.email);
  } else {
    await prisma.platformAdmin.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: { userId: adminUser.id },
    });

    console.log("✅ Platform admin ensured:", adminUser.email);
  }

  // ---- 2) GLOBAL & COMPANY PERMISSIONS ----
  const permissions: Array<{ key: string; description?: string; scope: 'GLOBAL' | 'COMPANY' }> = [
    // ==========================================
    // PLATFORM PERMISSIONS (Global Scope)
    // ==========================================
    { key: 'PLATFORM:MANAGE_USERS', description: 'Manage all platform users', scope: 'GLOBAL' },
    { key: 'PLATFORM:MANAGE_PERMISSIONS', description: 'Manage platform permissions catalog', scope: 'GLOBAL' },
    { key: 'PLATFORM:VIEW_ANALYTICS', description: 'View platform-wide analytics', scope: 'GLOBAL' },
    { key: 'PLATFORM:MANAGE_SETTINGS', description: 'Manage platform settings', scope: 'GLOBAL' },

    // ==========================================
    // COMPANY PERMISSIONS
    // ==========================================
    { key: 'COMPANY:CREATE', description: 'Create new companies', scope: 'GLOBAL' },
    { key: 'COMPANY:EDIT_SETTINGS', description: 'Edit company settings', scope: 'COMPANY' },
    { key: 'COMPANY:DELETE', description: 'Delete companies', scope: 'COMPANY' },
    { key: 'COMPANY:VIEW_DETAILS', description: 'View company details', scope: 'COMPANY' },
    { key: 'COMPANY:VIEW_ANALYTICS', description: 'View company analytics', scope: 'COMPANY' },
    { key: 'COMPANY:EXPORT_DATA', description: 'Export company data', scope: 'COMPANY' },

    // ==========================================
    // MEMBER MANAGEMENT
    // ==========================================
    { key: 'MEMBER:INVITE', description: 'Invite members to company', scope: 'COMPANY' },
    { key: 'MEMBER:REMOVE', description: 'Remove members from company', scope: 'COMPANY' },
    { key: 'MEMBER:EDIT_ROLE', description: 'Edit member roles', scope: 'COMPANY' },
    { key: 'MEMBER:VIEW_LIST', description: 'View members list', scope: 'COMPANY' },
    { key: 'MEMBER:VIEW_DETAILS', description: 'View member details', scope: 'COMPANY' },

    // ==========================================
    // ROLE MANAGEMENT
    // ==========================================
    { key: 'ROLE:CREATE', description: 'Create new roles', scope: 'COMPANY' },
    { key: 'ROLE:EDIT', description: 'Edit existing roles', scope: 'COMPANY' },
    { key: 'ROLE:DELETE', description: 'Delete roles', scope: 'COMPANY' },
    { key: 'ROLE:VIEW', description: 'View roles', scope: 'COMPANY' },
    { key: 'ROLE:ASSIGN_PERMISSIONS', description: 'Assign permissions to roles', scope: 'COMPANY' },

    // ==========================================
    // INVOICE MANAGEMENT
    // ==========================================
    { key: 'INVOICE:CREATE', description: 'Create invoices', scope: 'COMPANY' },
    { key: 'INVOICE:EDIT', description: 'Edit invoices', scope: 'COMPANY' },
    { key: 'INVOICE:DELETE', description: 'Delete invoices', scope: 'COMPANY' },
    { key: 'INVOICE:VIEW', description: 'View invoices', scope: 'COMPANY' },
    { key: 'INVOICE:APPROVE', description: 'Approve invoices', scope: 'COMPANY' },
    { key: 'INVOICE:EXPORT', description: 'Export invoice data', scope: 'COMPANY' },

    // ==========================================
    // REPORT MANAGEMENT
    // ==========================================
    { key: 'REPORT:CREATE', description: 'Create reports', scope: 'COMPANY' },
    { key: 'REPORT:EDIT', description: 'Edit reports', scope: 'COMPANY' },
    { key: 'REPORT:DELETE', description: 'Delete reports', scope: 'COMPANY' },
    { key: 'REPORT:VIEW', description: 'View reports', scope: 'COMPANY' },
    { key: 'REPORT:EXPORT', description: 'Export reports', scope: 'COMPANY' },
    { key: 'REPORT:SCHEDULE', description: 'Schedule automated reports', scope: 'COMPANY' },

    // ==========================================
    // TIME TRACKING
    // ==========================================
    { key: 'TIME:TRACK', description: 'Track time entries', scope: 'COMPANY' },
    { key: 'TIME:EDIT_OWN', description: 'Edit own time entries', scope: 'COMPANY' },
    { key: 'TIME:EDIT_ALL', description: 'Edit all time entries', scope: 'COMPANY' },
    { key: 'TIME:APPROVE', description: 'Approve time entries', scope: 'COMPANY' },
    { key: 'TIME:VIEW_REPORTS', description: 'View time tracking reports', scope: 'COMPANY' },
    { key: 'TIME:EXPORT', description: 'Export time tracking data', scope: 'COMPANY' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        description: permission.description,
        scope: permission.scope,
      },
      create: {
        key: permission.key,
        description: permission.description,
        scope: permission.scope,
      },
    });
  }

  console.log(`✅ Permissions ensured: ${permissions.length}`);

  // ---- 3) GRANT "COMPANY:CREATE" TO PLATFORM ADMIN ----
  const companyCreatePermission = await prisma.permission.findFirst({
    where: { key: "COMPANY:CREATE" },
  });

  if (companyCreatePermission && adminUser) {
    await prisma.userGlobalPermission.upsert({
      where: {
        userId_permissionId: {
          userId: adminUser.id,
          permissionId: companyCreatePermission.id,
        },
      },
      create: {
        userId: adminUser.id,
        permissionId: companyCreatePermission.id,
        grantedBy: adminUser.id,
      },
      update: {},
    });

    console.log("✅ Platform admin granted 'COMPANY:CREATE' permission");
  }

  console.log("🌱 Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
