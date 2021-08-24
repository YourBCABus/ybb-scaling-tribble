/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface BusInput {
  otherNames: string[];
  available: boolean;
  name?: string | null;
  company?: string | null;
  phone: string[];
}

export interface BusStatusInput {
  invalidateTime?: any | null;
  boardingArea?: string | null;
}

export interface LocationInput {
  lat: number;
  long: number;
}

export interface StopInput {
  name?: string | null;
  description?: string | null;
  location?: LocationInput | null;
  order?: number | null;
  arrivalTime?: any | null;
  invalidateTime?: any | null;
  available: boolean;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
