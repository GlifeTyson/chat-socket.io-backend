import { gql } from "apollo-server";

export const groupTypeDefs = gql`
  type Group {
    id: ID!
    name: String!
    description: String
    # memberIds: [ID!]!
    # messageIds: [ID!]!
    members: [User!]! #@relation(name: "Groups")
    messages: [Message!]! #@relation(name: "Messages")
    createdAt: DateTime!
    updatedAt: DateTime!
    deletedAt: DateTime
  }
  enum GroupOrder {
    createdAt_ASC
    createdAt_DESC
  }
  input GroupFilter {
    id: ID
    name_regex: String
    description_regex: String
    memberIds_has: ID!
  }
  type Query {
    group(id: ID!): Group
    groups(
      filter: GroupFilter
      orderBy: GroupOrder
      limit: Int
      offset: Int
    ): [Group!]!
  }

  type Mutation {
    createGroup(name: String!, description: String): CommonResponse!
    disbandGroup(id: ID!): CommonResponse!
  }
`;
