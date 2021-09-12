import { MutationQueue } from "./mutationQueue";
import { NextRouter } from "next/router";

import { BusInput } from "../__generated__/globalTypes";
import { GetBus_bus_stops } from "../__generated__/GetBus";

export const saveBoardingAreaCallback = 
    (updateServerSidePropsFunction: () => Promise<boolean>, mutationQueue: MutationQueue, handleConnQualFunction: (() => Promise<boolean>) | undefined) => 
        (id: string) => 
            (boardingArea: string | null) => {
                let returnVal = mutationQueue.addToQueue(
                    async () => {
                        if (!boardingArea) {
                            boardingArea = "?";
                        }
                        await fetch(`/api/updateBusStatus?id=${encodeURIComponent(id)}&boardingArea=${encodeURIComponent(boardingArea)}`);
                        await updateServerSidePropsFunction();
                    }
                );
                handleConnQualFunction?.().then((value) => value || mutationQueue.resolvePromise());
                return returnVal;
            }
    ;


export const saveBusCallback = 
    (updateServerSidePropsFunction: () => Promise<boolean>, mutationQueue: MutationQueue, handleConnQualFunction: (() => Promise<boolean>) | undefined) => 
        (id: string) => 
            (busInput: BusInput) => {
                let returnVal = mutationQueue.addToQueue(
                    async () => {
                        await fetch(`/api/updateBus?id=${encodeURIComponent(id)}&busData=${encodeURIComponent(JSON.stringify(busInput))}`);
                        await updateServerSidePropsFunction();
                    }
                );
                handleConnQualFunction?.().then((value) => value || mutationQueue.resolvePromise());
                return returnVal;
            }
    ;


export const saveStopOrderCallback = 
    (updateServerSidePropsFunction: () => Promise<boolean>, mutationQueue: MutationQueue, handleConnQualFunction: (() => Promise<boolean>) | undefined) =>
        (busId: string) => 
            (orderedStops: GetBus_bus_stops[]) => {
                let returnVal = mutationQueue.addToQueue(
                    async () => {
                        let orderedStopIds = orderedStops.map((stop) => stop.id);
                        await fetch(`/api/updateStopOrder?busId=${encodeURIComponent(busId)}&stopOrderData=${encodeURIComponent(JSON.stringify(orderedStopIds))}`);
                        await updateServerSidePropsFunction();
                    }
                );
                handleConnQualFunction?.().then((value) => value || mutationQueue.resolvePromise());
                return returnVal;
            }
    ;


export const createBusCallback = 
    (mutationQueue: MutationQueue, handleConnQualFunction: (() => Promise<boolean>) | undefined, router: NextRouter, id: string) => {
        let returnVal = mutationQueue.addToQueue(
            async () => {
                const response = await fetch(`/api/createBus?schoolId=${encodeURIComponent(id)}`);
                const json = await response.json();

                if (!json.createBus || typeof json.createBus.id !== "string") throw new Error("No ID");
                await router.push("/bus/[busId]", `/bus/${json.createBus.id}`);
            }
        );
        handleConnQualFunction?.().then((value) => value || mutationQueue.resolvePromise());
        return returnVal;
    };

export const deleteBusCallback =
    async (router: NextRouter, id: string, schoolID: string) => {
        await fetch(`/api/deleteBus?busId=${encodeURIComponent(id)}`, {method: "DELETE"});
        router.push("/school/[schoolId]", `/school/${schoolID}`);
    };

export const clearAllCallback =
    (updateServerSidePropsFunction: () => Promise<boolean>, mutationQueue: MutationQueue, handleConnQualFunction: (() => Promise<boolean>) | undefined, id: string) => {
        let returnVal = mutationQueue.addToQueue(
            async () => {
                await fetch(`/api/clearAll?schoolId=${encodeURIComponent(id)}`);
                await updateServerSidePropsFunction();
            }
        );
        handleConnQualFunction?.().then((value) => value || mutationQueue.resolvePromise());
        return returnVal;
    };
