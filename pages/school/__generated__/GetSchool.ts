/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSchool
// ====================================================

export interface GetSchool_school_location {
  __typename: "Location";
  lat: number;
  long: number;
}

export interface GetSchool_school_buses {
  __typename: "Bus";
  id: string;
  name: string | null;
  boardingArea: string | null;
  invalidateTime: any | null;
  available: boolean;
}

export interface GetSchool_school {
  __typename: "School";
  id: string;
  name: string | null;
  location: GetSchool_school_location | null;
  available: boolean;
  buses: GetSchool_school_buses[];
}

export interface GetSchool {
  school: GetSchool_school | null;
}

export interface GetSchoolVariables {
  id: string;
}
