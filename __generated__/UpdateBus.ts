/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BusInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateBus
// ====================================================

export interface UpdateBus_updateBus {
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

export interface UpdateBus {
  updateBus: UpdateBus_updateBus;
}

export interface UpdateBusVariables {
  busID: string;
  bus: BusInput;
}
