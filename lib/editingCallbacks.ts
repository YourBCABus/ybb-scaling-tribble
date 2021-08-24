import { BusInput } from "../__generated__/globalTypes";
import { GetBus_bus_stops } from "../pages/bus/__generated__/GetBus";

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
