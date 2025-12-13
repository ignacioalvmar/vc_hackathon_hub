import prisma from "../src/lib/prisma";

async function makeAdmin(email: string, name?: string) {
  try {
    // Try to find existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to ADMIN
      const user = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log(`✅ Successfully updated user ${email} to ADMIN role`);
      console.log(`User: ${user.name || "N/A"} (${user.email})`);
    } else {
      // Create new user with ADMIN role
      const user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          role: "ADMIN",
        },
      });
      console.log(`✅ Successfully created new admin user`);
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`Role: ${user.role}`);
      console.log(`\n⚠️  Note: This app uses GitHub OAuth for authentication.`);
      console.log(`   When logging in, use a GitHub account with email: ${email}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Unknown error:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const name = process.argv[3];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: npx tsx scripts/make-admin.ts <email> [name]");
  process.exit(1);
}

makeAdmin(email, name);

