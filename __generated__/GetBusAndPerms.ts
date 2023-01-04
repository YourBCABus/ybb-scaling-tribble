/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetBusAndPerms
// ====================================================

export interface GetBusAndPerms_bus_stops_location {
  __typename: "Location";
  lat: number;
  long: number;
}

export interface GetBusAndPerms_bus_stops {
  __typename: "Stop";
  id: string;
  name: string | null;
  description: string | null;
  location: GetBusAndPerms_bus_stops_location | null;
  order: number | null;
}

export interface GetBusAndPerms_bus_school {
  __typename: "School";
  name: string | null;
}

export interface GetBusAndPerms_bus {
  __typename: "Bus";
  available: boolean;
  boardingArea: string | null;
  company: string | null;
  id: string;
  invalidateTime: any | null;
  name: string | null;
  otherNames: string[];
  phone: string[];
  schoolID: string;
  stops: GetBusAndPerms_bus_stops[];
  school: GetBusAndPerms_bus_school;
}

export interface GetBusAndPerms {
  bus: GetBusAndPerms_bus | null;
  currentSchoolScopes: string[];
}

export interface GetBusAndPermsVariables {
  id: string;
  schoolID: string;
}
