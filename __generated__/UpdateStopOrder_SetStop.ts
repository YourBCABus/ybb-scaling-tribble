/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { StopInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateStopOrder_SetStop
// ====================================================

export interface UpdateStopOrder_SetStop_updateStop_location {
  __typename: "Location";
  lat: number;
  long: number;
}

export interface UpdateStopOrder_SetStop_updateStop {
  __typename: "Stop";
  id: string;
  busID: string;
  name: string | null;
  description: string | null;
  location: UpdateStopOrder_SetStop_updateStop_location | null;
  order: number | null;
  arrivalTime: any | null;
  invalidateTime: any | null;
  available: boolean;
}

export interface UpdateStopOrder_SetStop {
  updateStop: UpdateStopOrder_SetStop_updateStop;
}

export interface UpdateStopOrder_SetStopVariables {
  stopID: string;
  stopData: StopInput;
}
