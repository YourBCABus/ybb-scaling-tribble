/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BusStatusInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateBusStatus
// ====================================================

export interface UpdateBusStatus_updateBusStatus {
  __typename: "Bus";
  id: string;
  schoolID: string;
  boardingArea: string | null;
  otherNames: string[];
  invalidateTime: any | null;
  available: boolean;
  name: string | null;
  company: string | null;
  phone: string[];
  numbers: string[];
}

export interface UpdateBusStatus {
  updateBusStatus: UpdateBusStatus_updateBusStatus;
}

export interface UpdateBusStatusVariables {
  busID: string;
  busStatus: BusStatusInput;
}
