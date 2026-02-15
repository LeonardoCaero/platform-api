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
    // Global permissions (platform-level)
    { key: "company:create", description: "Create a new company", scope: "GLOBAL" },

    // Company-level permissions
    { key: "users:read", description: "View users in company", scope: "COMPANY" },
    { key: "users:invite", description: "Invite users to company", scope: "COMPANY" },
    { key: "users:remove", description: "Remove users from company", scope: "COMPANY" },
    { key: "users:manage_roles", description: "Assign roles to users", scope: "COMPANY" },

    { key: "company:read", description: "View company information", scope: "COMPANY" },
    { key: "company:update", description: "Update company settings", scope: "COMPANY" },
    { key: "company:delete", description: "Delete company", scope: "COMPANY" },

    { key: "roles:read", description: "View roles and permissions", scope: "COMPANY" },
    { key: "roles:create", description: "Create roles", scope: "COMPANY" },
    { key: "roles:update", description: "Update roles", scope: "COMPANY" },
    { key: "roles:delete", description: "Delete roles", scope: "COMPANY" },
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

  // ---- 3) GRANT "company:create" TO PLATFORM ADMIN ----
  const companyCreatePermission = await prisma.permission.findFirst({
    where: { key: "company:create" },
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

    console.log("✅ Platform admin granted 'company:create' permission");
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
