import { gql } from "apollo-server";

export const scalarTypeDefs = gql`
  scalar DateTime
    @specifiedBy(url: "https://scalars.graphql.org/andimarek/date-time")

  type CommonResponse {
    success: Boolean!
    message: String
    errors: [Error!]
  }
  type Error {
    field: String
    path: String
    message: String
  }
`;
