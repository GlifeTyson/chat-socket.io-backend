import { prisma } from "../connectDb/db.js";
import buildMongoFilters from "../utils/buildMongoFilters.js";
import buildMongoOrders from "../utils/buildMongoOrders.js";
export const groupResolvers = {
  Query: {
    group: async (parent, { id }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const group = await prisma.group.findUnique({
          where: {
            id: id,
          },
          include: {
            members: true,
          },
        });
        if (!group) {
          throw new Error("Group not found");
        } else {
          return group;
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    groups: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const { filter = {}, orderBy, limit, offset } = args;

        const filters = buildMongoFilters(filter);
        const orders = buildMongoOrders(orderBy);
        const skip = offset || 0;
        const take = limit || 10;

        const groups = await prisma.group.findMany({
          where: filters,
          orderBy: orders,
          skip: skip,
          take: take,
          include: {
            members: true,
            // messages:true
          },
        });
        return groups;
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  Mutation: {
    createGroup: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }

        const { name, description } = args;

        const group = await prisma.group.create({
          data: {
            name: name,
            description: description || "",
            memberIds: [authorizedUser.id],
          },
        });
        await prisma.user.update({
          where: {
            id: authorizedUser.id,
          },
          data: {
            groupIds: [group.id],
          },
        });
        return {
          message: "Created group successfully",
          success: true,
          errors: null,
        };
      } catch (error) {
        throw new Error(error);
      }
    },

    disbandGroup: async (parent, { id }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const groupFound = await prisma.group.findUnique({
          where: {
            id: id,
            deletedAt: { isSet: false },
          },
          include: {
            members: true,
          },
        });
        if (!groupFound) {
          throw new Error("Group not found");
        }
        // deletegroup and remove all users from group
        const members = groupFound.members;

        for (const member of members) {
          await prisma.user.update({
            where: {
              id: member.id,
            },
            data: {
              groupIds: {
                set: member.groupIds.filter((id) => id !== groupFound.id),
              },
            },
          });
        }
        await prisma.group.update({
          where: {
            id: groupFound.id,
          },
          data: {
            deletedAt: new Date(),
            memberIds: {
              set: [],
            },
          },
        });
        return {
          success: true,
          message: "Group disband successfully",
          errors: null,
        };
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};
