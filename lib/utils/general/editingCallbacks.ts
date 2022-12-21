import { MutationQueue } from "../editing/mutation-queue";

import { GetBus_bus_stops } from "__generated__/GetBus";


export const saveStopOrderCallback = 
    (updateServerSidePropsFunction: () => Promise<boolean>, mutationQueue: MutationQueue, handleConnQualFunction: (() => Promise<boolean>) | undefined) =>
        (busId: string) => 
            (orderedStops: GetBus_bus_stops[]) => {
                const returnVal = mutationQueue.addToQueue(
                    async () => {
                        const orderedStopIds = orderedStops.map((stop) => stop.id);
                        await fetch(`/api/updateStopOrder?busId=${encodeURIComponent(busId)}&stopOrderData=${encodeURIComponent(JSON.stringify(orderedStopIds))}`);
                        await updateServerSidePropsFunction();
                    }
                );
                handleConnQualFunction?.().then((value) => value || mutationQueue.resolvePromise());
                return returnVal;
            }
    ;


