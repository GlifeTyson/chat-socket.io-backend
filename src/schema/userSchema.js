import { gql } from "apollo-server";

export const userTypeDefs = gql`
  type User {
    id: ID!
    username: String!
    gender: String!
    fullName: String!
    password: String!
    profilePicture: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    deletedAt: DateTime
    groups: [Group!]! #@relation(name: "Groups")
    messagesSent: [Message!]! #@relation(name: "MessagesSent")
    messagesReceived: [Message!]! #@relation(name: "MessagesReceived")
    conversations1: [Conversation!]! #@relation(name: "User1Conversations")
    conversations2: [Conversation!]! #@relation(name: "User2Conversations")
    groupIds: [ID!]!
  }
  enum Gender {
    male
    female
  }
  type LoginResponse {
    success: Boolean!
    message: String
    token: String
    user: User
  }
  type RegisterResponse {
    success: Boolean!
    message: String
    user: User
  }
  input NewUserInput {
    username: String!
    fullName: String!
    password: String!
    gender: Gender!
    profilePicture: String
  }

  input UpdateUserInput {
    username: String
    fullName: String
    password: String
    gender: Gender
    profilePicture: String
  }
  enum UserOrder {
    createdAt_ASC
    createdAt_DESC
  }
  input UserFilter {
    id: ID
    username_regex: String
    fullName_regex: String
  }
  type Query {
    Me: User
    allUser(
      filter: UserFilter
      orderBy: UserOrder
      limit: Int
      offset: Int
    ): [User!]!
    usersWithOutLoggedUser: [User!]!
  }
  type Mutation {
    createUser(input: NewUserInput!): RegisterResponse!
    updateUser(
      id: ID!
      username: String
      gender: String
      fullName: String
      password: String
      profilePicture: String
      groupIds: [ID!]!
    ): User!
    deleteUser(id: ID!): User
    addUserToGroup(id: ID!, groupId: ID!): CommonResponse!
    removeUserFromGroup(id: ID!, groupId: ID!): CommonResponse!
    login(username: String!, password: String!): LoginResponse!
  }
`;
