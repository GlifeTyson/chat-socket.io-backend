import { prisma } from "../connectDb/db.js";
import buildMongoFilters from "../utils/buildMongoFilters.js";
import buildMongoOrders from "../utils/buildMongoOrders.js";

export const conversationResolvers = {
  Query: {
    conversations: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const { filter, orderBy, limit, offset } = args;

        const filters = buildMongoFilters(filter);
        const orders = buildMongoOrders(orderBy);
        const skip = offset || 0;
        const take = limit || 10;

        const conversations = await prisma.conversation.findMany({
          where: filters,
          orderBy: orders,
          skip: skip,
          take: take,
          include: {
            user1: true,
            user2: true,
            messages: true,
          },
        });

        return conversations;
      } catch (error) {
        throw new Error(error);
      }
    },
    conversation: async (parent, args, context) => {},
    myConversations: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }

        const conversations = await prisma.conversation.findMany({
          where: {
            OR: [
              { user1Id: authorizedUser.id },
              { user2Id: authorizedUser.id },
            ],
            deletedAt: { isSet: false },
          },
          orderBy: { createdAt: "desc" },
          include: {
            user1: true,
            user2: true,
            messages: true,
          },
        });
        return conversations;
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  Mutation: {
    createConversation: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        const { user2Id } = args;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const user2Found = await prisma.user.findUnique({
          where: {
            id: user2Id,
            deletedAt: { isSet: false },
          },
        });
        if (!user2Found) {
          throw new Error("User not found");
        }

        if (authorizedUser.id === user2Found.id) {
          throw new Error("User cannot be in a conversation with himself");
        }

        const conversationFound = await prisma.conversation.findFirst({
          where: {
            OR: [
              { user1Id: authorizedUser.id, user2Id: user2Id },
              { user1Id: user2Id, user2Id: authorizedUser.id },
            ],
          },
        });
        if (conversationFound) {
          throw new Error("Conversation already exists");
        }
        const conversation = await prisma.conversation.create({
          data: {
            user1Id: authorizedUser.id,
            user2Id: user2Id,
          },
        });
        return {
          success: true,
          message: "Conversation created successfully",
          errors: null,
        };
      } catch (error) {
        throw new Error(error);
      }
    },
    updateConversation: async (parent, args, context) => {},
    deleteConversation: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const { id } = args;
        const conversationFound = await prisma.conversation.findUnique({
          where: {
            id: id,
            deletedAt: { isSet: false },
          },
        });
        if (!conversationFound) {
          throw new Error("Conversation not found");
        }
        if (
          conversationFound.user1Id !== authorizedUser.id &&
          conversationFound.user2Id !== authorizedUser.id
        ) {
          throw new Error("Unauthorized to delete other conversation");
        }
        await prisma.conversation.update({
          where: {
            id: id,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};
