/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSchoolAndPerms
// ====================================================

export interface GetSchoolAndPerms_school_location {
  __typename: "Location";
  lat: number;
  long: number;
}

export interface GetSchoolAndPerms_school_buses {
  __typename: "Bus";
  id: string;
  name: string | null;
  boardingArea: string | null;
  invalidateTime: any | null;
  available: boolean;
}

export interface GetSchoolAndPerms_school {
  __typename: "School";
  id: string;
  name: string | null;
  location: GetSchoolAndPerms_school_location | null;
  buses: GetSchoolAndPerms_school_buses[];
}

export interface GetSchoolAndPerms {
  school: GetSchoolAndPerms_school | null;
  currentSchoolScopes: string[];
}

export interface GetSchoolAndPermsVariables {
  id: string;
}
