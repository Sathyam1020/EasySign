import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./database";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  events: {
    async userCreated(payload: any) {
      const { user } = payload;

      // 1. create default org
      const org = await prisma.organization.create({
        data: {
          name: `${user.name || "My"} Organization`,
          ownerId: user.id,
        },
      });

      // 2. add user as admin in that org
      await prisma.organizationMember.create({
        data: {
          orgId: org.id,
          userId: user.id,
          role: "admin",
        },
      });
    },
  },
});
