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

  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const createdAdmin = await prisma.user.create({
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

    console.log("✅ Platform admin created:", createdAdmin.email);
  } else {
    await prisma.platformAdmin.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: { userId: adminUser.id },
    });

    console.log("✅ Platform admin ensured:", adminUser.email);
  }

  // ---- 2) GLOBAL PERMISSIONS ----
  const permissions: Array<{ key: string; description?: string }> = [
    { key: "users:read", description: "View users in company" },
    { key: "users:invite", description: "Invite users to company" },
    { key: "users:remove", description: "Remove users from company" },
    { key: "users:manage_roles", description: "Assign roles to users" },

    { key: "company:read", description: "View company information" },
    { key: "company:update", description: "Update company settings" },
    { key: "company:delete", description: "Delete company" },

    { key: "roles:read", description: "View roles and permissions" },
    { key: "roles:create", description: "Create roles" },
    { key: "roles:update", description: "Update roles" },
    { key: "roles:delete", description: "Delete roles" },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        description: permission.description,
      },
      create: {
        key: permission.key,
        description: permission.description,
      },
    });
  }

  console.log(`✅ Permissions ensured: ${permissions.length}`);

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
