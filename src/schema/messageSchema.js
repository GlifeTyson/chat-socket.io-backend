import { gql } from "apollo-server";

export const messageTypeDefs = gql`
  type Message {
    id: ID!
    senderId: ID
    receiverId: ID
    groupId: ID
    conversationId: ID!
    content: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    deletedAt: DateTime
    sender: User #@relation(name: "MessagesSent")
    receiver: User #@relation(name: "MessagesReceived")
    group: Group
    conversation: Conversation #@relation(name: "Messages")
  }
  input MessageFilter {
    id: ID
    content_regex: String
  }
  enum MessageOrder {
    createdAt_ASC
    createdAt_DESC
  }
  type Query {
    message(id: ID!): Message
    messages(
      filter: MessageFilter
      orderBy: MessageOrder
      limit: Int
      offset: Int
    ): [Message!]!
    myMessages(userId: ID!): [Message!]!
  }

  type Mutation {
    sendMessage(
      receiverId: ID
      conversationId: ID
      groupId: ID
      content: String!
    ): CommonResponse!
    updateMessage(id: ID!, content: String): Message!
    deleteMessage(id: ID!): Message
  }
`;
