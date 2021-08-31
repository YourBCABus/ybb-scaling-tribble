import { MutationQueue } from "./mutationQueue";
import { NextRouter } from "next/router";

import { BusInput } from "../__generated__/globalTypes";
import { GetBus_bus_stops } from "../__generated__/GetBus";

export const saveBoardingAreaCallback = 
    (updateServerSidePropsFunction: () => void, mutationQueue: MutationQueue) => 
        (id: string) => 
            (boardingArea: string | null) => {
                mutationQueue.addToQueue(
                    async () => {
                        if (!boardingArea) {
                            boardingArea = "?";
                        }
                        await fetch(`/api/updateBusStatus?id=${encodeURIComponent(id)}&boardingArea=${encodeURIComponent(boardingArea)}`);
                        updateServerSidePropsFunction();
                    }
                );
                
            }
    ;


export const saveBusCallback = 
    (updateServerSidePropsFunction: () => void, mutationQueue: MutationQueue) => 
        (id: string) => 
            (busInput: BusInput) => {
                mutationQueue.addToQueue(
                    async () => {
                        await fetch(`/api/updateBus?id=${encodeURIComponent(id)}&busData=${encodeURIComponent(JSON.stringify(busInput))}`);
                        updateServerSidePropsFunction();
                    }
                );
            }
    ;


export const saveStopOrderCallback = 
    (updateServerSidePropsFunction: () => void, mutationQueue: MutationQueue) =>
        (busId: string) => 
            (orderedStops: GetBus_bus_stops[]) => {
                mutationQueue.addToQueue(
                    async () => {
                        let orderedStopIds = orderedStops.map((stop) => stop.id);
                        await fetch(`/api/updateStopOrder?busId=${encodeURIComponent(busId)}&stopOrderData=${encodeURIComponent(JSON.stringify(orderedStopIds))}`);
                        updateServerSidePropsFunction();
                    }
                );
            }
    ;


export const createBusCallback = 
    (mutationQueue: MutationQueue, router: NextRouter, id: string) => {
        
        mutationQueue.addToQueue(
            async () => { 
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
            }
        );
    };
