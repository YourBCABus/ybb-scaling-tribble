/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetBus
// ====================================================

export interface GetBus_bus_stops_location {
  __typename: "Location";
  lat: number;
  long: number;
}

export interface GetBus_bus_stops {
  __typename: "Stop";
  id: string;
  name: string | null;
  description: string | null;
  location: GetBus_bus_stops_location | null;
  order: number | null;
}

export interface GetBus_bus_school {
  __typename: "School";
  name: string | null;
}

export interface GetBus_bus {
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
  stops: GetBus_bus_stops[];
  school: GetBus_bus_school;
}

export interface GetBus {
  bus: GetBus_bus | null;
}

export interface GetBusVariables {
  id: string;
}
