/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: UpdateStopOrder_GetBus
// ====================================================

export interface UpdateStopOrder_GetBus_bus_stops_location {
  __typename: "Location";
  lat: number;
  long: number;
}

export interface UpdateStopOrder_GetBus_bus_stops {
  __typename: "Stop";
  id: string;
  name: string | null;
  description: string | null;
  location: UpdateStopOrder_GetBus_bus_stops_location | null;
  order: number | null;
  arrivalTime: any | null;
  invalidateTime: any | null;
  available: boolean;
}

export interface UpdateStopOrder_GetBus_bus {
  __typename: "Bus";
  stops: UpdateStopOrder_GetBus_bus_stops[];
}

export interface UpdateStopOrder_GetBus {
  bus: UpdateStopOrder_GetBus_bus | null;
}

export interface UpdateStopOrder_GetBusVariables {
  busID: string;
}
