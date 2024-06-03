import { gql } from "apollo-server";

export const conversationTypeDefs = gql`
  type Conversation {
    id: ID!
    user1Id: ID!
    user2Id: ID!
    lastMessageAt: DateTime!
    unreadCount: Int!
    messages: [Message!]! #@relation(name: "Messages")
    user1: User! #@relation(name: "User1Conversations")
    user2: User! #@relation(name: "User2Conversations")
    createdAt: DateTime!
    updatedAt: DateTime!
    deletedAt: DateTime
  }

  input ConversationFilter {
    user1Id: ID
    user2Id: ID
  }

  enum ConversationOrder {
    createdAt_ASC
    createdAt_DESC
  }
  type Query {
    conversation(id: ID!): Conversation
    conversations(
      filter: ConversationFilter
      orderBy: ConversationOrder
      limit: Int
      offset: Int
    ): [Conversation!]!
    myConversations: [Conversation!]!
  }

  type Mutation {
    createConversation(user2Id: ID!): CommonResponse!
    updateConversation(
      id: ID!
      user1Id: ID
      user2Id: ID
      lastMessageAt: DateTime
      unreadCount: Int
    ): Conversation!
    deleteConversation(id: ID!): Conversation
  }
`;
