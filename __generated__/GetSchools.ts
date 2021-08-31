/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSchools
// ====================================================

export interface GetSchools_schools {
  __typename: "RedactedSchool";
  id: string;
  name: string | null;
  readable: boolean;
}

export interface GetSchools {
  schools: GetSchools_schools[];
}
