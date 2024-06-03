import { prisma } from "../connectDb/db.js";
import { comparePassword, createTokens, hashPassword } from "../utils/auth.js";
import buildMongoFilters from "../utils/buildMongoFilters.js";
import buildMongoOrders from "../utils/buildMongoOrders.js";
import validateUser from "../validator/userValidator.js";

export const userResolvers = {
  Query: {
    // allUsers: async (parent, args, context) => {},
    Me: async (parent, args, context) => {
      const { authorizedUser } = context;
      return authorizedUser;
    },
    allUser: async (parent, args, context) => {
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

        const users = await prisma.user.findMany({
          where: filters,
          orderBy: orders,
          skip: skip,
          take: take,
          include: {
            groups: true,
            messagesReceived: true,
            messagesSent: true,
            conversations1: {
              include: {
                messages: true,
              },
            },
            conversations2: {
              include: {
                messages: true,
              },
            },
          },
        });
        return users;
      } catch (error) {
        throw new Error(error);
      }
    },
    usersWithOutLoggedUser: async (parent, args, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        return await prisma.user.findMany({
          where: {
            id: { not: authorizedUser.id },
            deletedAt: { isSet: false },
          },
        });
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  Mutation: {
    createUser: async (parent, { input: args }, context) => {
      try {
        const { username, fullName, password, gender } = args;
        const userValidate = validateUser(args);
        if (userValidate.error) {
          throw new Error(userValidate.error.message);
        }
        const userExist = await prisma.user.findFirst({
          where: {
            username: username,
          },
        });
        if (userExist) {
          throw new Error("User already exist");
        }
        const hashedPassword = hashPassword(password);

        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const user = await prisma.user.create({
          data: {
            username,
            fullName,
            password: hashedPassword,
            gender,
            profilePicture: gender === "male" ? boyProfilePic : girlProfilePic,
            groupIds: [],
          },
        });
        return {
          success: true,
          user: user,
          message: "User created successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || "An error occurred during user creation",
        };
      }
    },
    login: async (parent, args, context) => {
      try {
        const { SECRET1 } = context;

        const { password, username } = args;
        const userCheck = await prisma.user.findFirst({
          where: {
            username: username,
          },
        });
        if (!userCheck) {
          throw new Error("User not found");
        }
        const cpPassword = comparePassword(password, userCheck.password);

        if (!cpPassword) {
          throw new Error("Wrong password");
        }

        const token = await createTokens({
          user: userCheck,
          secret1: SECRET1,
        });

        return {
          success: true,
          token: token,
          user: userCheck,
          message: "Login successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || "An error occurred during login",
        };
      }
    },
    addUserToGroup: async (parent, { id, groupId }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const userFound = await prisma.user.findUnique({
          where: {
            id: id,
            deletedAt: { isSet: false },
          },
        });
        if (!userFound) {
          throw new Error("User not found");
        }
        const groupFound = await prisma.group.findUnique({
          where: {
            id: groupId,
            deletedAt: { isSet: false },
          },
        });
        if (!groupFound) {
          throw new Error("Group not found");
        }

        if (groupFound.memberIds.includes(userFound.id)) {
          throw new Error("User already in group");
        }
        const userPush = await prisma.user.update({
          where: {
            id: id,
          },
          data: {
            groupIds: { push: groupId },
          },
        });

        await prisma.group.update({
          where: {
            id: groupFound.id,
          },
          data: {
            memberIds: { push: userPush.id },
          },
        });
        return {
          success: true,
          message: "User added to group successfully",
        };
      } catch (error) {
        throw new Error(error);
      }
    },
    removeUserFromGroup: async (parent, { id, groupId }, context) => {
      try {
        const { authorizedUser } = context;
        if (!authorizedUser) {
          throw new Error("Unauthorized");
        }
        const userFound = await prisma.user.findUnique({
          where: {
            id: id,
            deletedAt: { isSet: false },
          },
        });
        if (!userFound) {
          throw new Error("User not found");
        }
        const groupFound = await prisma.group.findUnique({
          where: {
            id: groupId,
            deletedAt: { isSet: false },
          },
        });
        if (!groupFound) {
          throw new Error("Group not found");
        }

        if (!groupFound.memberIds.includes(userFound.id)) {
          throw new Error("User not in group");
        }
        const userRemove = await prisma.user.update({
          where: {
            id: userFound.id,
          },
          data: {
            groupIds: {
              set: userFound.groupIds.filter((id) => id !== groupId),
            },
          },
        });

        await prisma.group.update({
          where: {
            id: groupFound.id,
          },
          data: {
            memberIds: {
              set: groupFound.memberIds.filter((id) => id !== userRemove.id),
            },
          },
        });
        return {
          success: true,
          message: "User removed from group successfully",
          errors: null,
        };
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};
