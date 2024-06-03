import { prisma } from "../connectDb/db.js";
import { getReceiveSocketId } from "../socket/socket.js";
import buildMongoFilters from "../utils/buildMongoFilters.js";
import buildMongoOrders from "../utils/buildMongoOrders.js";

export const messageResolvers = {
  Query: {
    messages: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        const { filter, orderBy, limit, offset } = args;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const filters = buildMongoFilters(filter);
        const orders = buildMongoOrders(orderBy);
        const skip = offset || 0;
        const take = limit || 10;
        const messages = await prisma.message.findMany({
          where: filters,
          orderBy: orders,
          skip: skip,
          take: take,
          include: {
            sender: true,
            receiver: true,
            group: true,
            conversation: true,
          },
        });
        return messages;
      } catch (error) {
        throw new Error(error);
      }
    },
    myMessages: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const { userId } = args;
        const messages = await prisma.message.findMany({
          where: {
            OR: [
              {
                senderId: authorizedUser.id,
                receiverId: userId,
              },
              {
                senderId: userId,
                receiverId: authorizedUser.id,
              },
            ],
            groupId: null,
            deletedAt: { isSet: false },
          },
          include: {
            receiver: true,
            sender: true,
          },
        });
        return messages;
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  Mutation: {
    sendMessage: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        // Kiểm tra xác thực
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }

        const { content, conversationId, groupId, receiverId } = args;

        // Kiểm tra dữ liệu đầu vào
        if (content.trim().length === 0) {
          throw new Error("Content cannot be empty");
        }
        if (receiverId) {
          // Kiểm tra người nhận
          const receiver = await prisma.user.findUnique({
            where: {
              id: receiverId,
              deletedAt: { isSet: false },
            },
          });

          if (!receiver) {
            throw new Error("Receiver not found");
          }
        }

        // Kiểm tra Conversation hoặc Group
        let conversation;
        let group;
        //kiem tra tung truong hop gui tin nhan qua conversation hay gui vao group
        if (conversationId) {
          conversation = await prisma.conversation.findUnique({
            where: {
              id: conversationId,
              deletedAt: { isSet: false },
            },
          });
          if (!conversation) {
            throw new Error("Conversation not found");
          }
        } else if (groupId) {
          group = await prisma.group.findUnique({
            where: {
              id: groupId,
              deletedAt: { isSet: false },
            },
          });
          if (!group) {
            throw new Error("Group not found");
          }
        } else {
          // Tạo Conversation mới nếu chưa tồn tại giữa authorizedUser và receiver
          conversation = await prisma.conversation.create({
            data: {
              user1Id: authorizedUser.id,
              user2Id: receiverId,
            },
          });
        }
        // Tạo Message
        const newMessage = await prisma.message.create({
          data: {
            senderId: authorizedUser.id,
            receiverId: receiverId,
            content: content,
            conversationId: conversation?.id || null, // Sử dụng null nếu không có conversationId
            groupId: groupId || null, // Sử dụng null nếu không có groupId
          },
        });
        // Cập nhật trạng thái
        if (conversation) {
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: newMessage.createdAt,
              unreadCount: {
                increment: 1,
              },
            },
          });
        } else if (group) {
          await prisma.group.update({
            where: { id: group.id },
            data: {
              lastMessageAt: newMessage.createdAt,
              unreadCount: {
                increment: 1,
              },
            },
          });
        }
        // const receiverSocketId = getReceiveSocketId(receiverId);
        // console.log("first", receiverSocketId);
        return {
          success: true,
          message: "Message sent successfully",
          errors: null,
        };
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};
