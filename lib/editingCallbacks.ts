import { NextRouter } from "next/router";

import { BusInput } from "../__generated__/globalTypes";
import { GetBus_bus_stops } from "../__generated__/GetBus";

export const saveBoardingAreaCallback = 
    (updateServerSidePropsFunction: () => void) => 
        (id: string) => 
            async (boardingArea: string | null): Promise<void> => {
                if (!boardingArea) {
                    boardingArea = "?";
                }
                await fetch(`/api/updateBusStatus?id=${encodeURIComponent(id)}&boardingArea=${encodeURIComponent(boardingArea)}`);
                updateServerSidePropsFunction();
            }
    ;


export const saveBusCallback = 
    (updateServerSidePropsFunction: () => void) => 
        (id: string) => 
            async (busInput: BusInput) => {
                await fetch(`/api/updateBus?id=${encodeURIComponent(id)}&busData=${encodeURIComponent(JSON.stringify(busInput))}`);
                updateServerSidePropsFunction();
            }
    ;


export const saveStopOrderCallback = 
    (updateServerSidePropsFunction: () => void) =>
        (busId: string) => 
            async (orderedStops: GetBus_bus_stops[]) => {
                let orderedStopIds = orderedStops.map((stop) => stop.id);
                await fetch(`/api/updateStopOrder?busId=${encodeURIComponent(busId)}&stopOrderData=${encodeURIComponent(JSON.stringify(orderedStopIds))}`);
                updateServerSidePropsFunction();
            }
    ;


export const createBusCallback = 
    async (router: NextRouter, id: string) => {
        try {
            const response = await fetch(`/api/createBus?schoolId=${encodeURIComponent(id)}`);
            const json = await response.json();

            if (!json.createBus || typeof json.createBus.id !== "string") throw new Error("No ID");
            router.push("/bus/[busId]", `/bus/${json.createBus.id}`);
        } catch (e) {
            console.error(e);
            // TODO: Better error handling
            alert("Unable to create bus");
        }
    };
