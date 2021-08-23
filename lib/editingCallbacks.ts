import { BusInput } from "../__generated__/globalTypes";

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
