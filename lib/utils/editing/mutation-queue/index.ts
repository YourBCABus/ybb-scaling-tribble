import React from "react";
import { ExternalPromise } from "@general-utils/externalpromise";

import { createBus, CreateBus, deleteBus, DeleteBus } from "./create-delete-bus";

import updateBoardingArea, { UpdateBoardingArea } from "./update-boarding-area";
import { updateBusName, UpdateBusName, updateBusActivation, UpdateBusActivation, updateBusPhones, UpdateBusPhones } from "./update-bus";
import clearAll, { ClearAll } from "./clear-all";
import Router from "next/router";

export enum MutationType {
    UP_B_BOARD = "bus_b_area", UP_B_NAME = "bus_name", UP_B_ACT = "bus_activation", UP_B_PHONES = "bus_phones",
    CR_B = "bus_create", DL_B = "bus_delete",
    CL_ALL = "clear_all",
}

export type Mutation = UpdateBoardingArea | UpdateBusName | UpdateBusActivation | UpdateBusPhones | CreateBus | DeleteBus | ClearAll;

export const updateServerSidePropsFunction = () => {
    const currRouter = Router;
    return currRouter.replace(currRouter.asPath, undefined, {scroll: false});
};

type MutationResult = ExternalPromise<Response, Error>;

const wrapTryN = <T extends (...inputs: P) => Promise<Response>, P extends unknown[]>(fn: T, tryCount: number) => (...inputs: P) => {
    const ret: MutationResult = new ExternalPromise();
    (async () => {
        let currError: Error | undefined;
        for (let i = 0; i < tryCount; i++) {
            try {
                const output = await fn(...inputs);
                ret.resolve(output);
                return;
            } catch (e) {
                currError ??= e instanceof Error ? e : undefined;
            }
        }
        currError ??= new Error("Failed with no error message");

        ret.reject(currError);
    })();
    return ret;
};


type QueueItem = {
    mutation: Mutation,
    promise: MutationResult,
};


type MutationHandlerMap = {
    [MutationType.UP_B_BOARD]: (mutation: UpdateBoardingArea) => ExternalPromise<Response, Error>;
    [MutationType.UP_B_NAME]: (mutation: UpdateBusName) => ExternalPromise<Response, Error>;
    [MutationType.UP_B_ACT]: (mutation: UpdateBusActivation) => ExternalPromise<Response, Error>;
    [MutationType.UP_B_PHONES]: (mutation: UpdateBusPhones) => ExternalPromise<Response, Error>;

    [MutationType.CR_B]: (mutation: CreateBus) => ExternalPromise<Response, Error>;
    [MutationType.DL_B]: (mutation: DeleteBus) => ExternalPromise<Response, Error>;

    [MutationType.CL_ALL]: (mutation: ClearAll) => ExternalPromise<Response, Error>;
};

const mutationMap: MutationHandlerMap = {
    bus_b_area: wrapTryN(updateBoardingArea, 3),
    bus_name: wrapTryN(updateBusName, 3),
    bus_activation: wrapTryN(updateBusActivation, 3),
    bus_phones: wrapTryN(updateBusPhones, 3),
    bus_create: wrapTryN(createBus, 1),
    bus_delete: wrapTryN(deleteBus, 3),
    clear_all: wrapTryN(clearAll, 3),
};

export class MutationQueue {
    private queue: QueueItem[];

    private running: boolean;
    
    constructor() {
        this.queue = [];
        this.running = false;
    }

    public enqueue(mutation: Mutation): Promise<Response> {
        const promise = new ExternalPromise<Response, Error>();
        this.queue.push({
            mutation,
            promise,
        });

        this.runToEmpty();
        
        return promise.promise;
    }

    private runToEmpty(): Promise<void> {
        const externalPromise = new ExternalPromise<void, void>();
        if (!this.running) {
            (async () => {
                while (this.queue.length) {
                    const queueEntry = this.queue.shift();
                    if (!queueEntry) break;
                    const {
                        promise: externMutationPromise,
                        mutation: mutationData,
                    } = queueEntry;
                    try {
                        externMutationPromise.resolve(await this.runMutation(mutationData).promise);
                    } catch (e) {
                        if (e instanceof Error) externMutationPromise.reject(e);
                        else {
                            alert("INTERNAL ERROR: WRONG TYPE RETURNED - " + JSON.stringify(e));
                            externMutationPromise.reject(new Error("INTERNAL ERROR: WRONG TYPE RETURNED"));
                        }
                    }
                    // .then(ok => externMutationPromise.resolve(ok)).catch(err => mutation.promise.reject(err));

                }
                externalPromise.resolve();
            })();
        } else {
            externalPromise.resolve();
        }

        return externalPromise.promise;
    }

    private runMutation<T extends Mutation>(mutation: T): ExternalPromise<Response, Error> {
        switch (mutation.__type) {
        case MutationType.UP_B_BOARD:
            return mutationMap[mutation.__type](mutation);
        case MutationType.UP_B_NAME:
            return mutationMap[mutation.__type](mutation);
        case MutationType.UP_B_ACT:
            return mutationMap[mutation.__type](mutation);
        case MutationType.UP_B_PHONES:
            return mutationMap[mutation.__type](mutation);

        case MutationType.CR_B:
            return mutationMap[mutation.__type](mutation);
        case MutationType.DL_B:
            return mutationMap[mutation.__type](mutation);
        
        case MutationType.CL_ALL:
            return mutationMap[mutation.__type](mutation);
        }
    }

    get length() {
        return this.queue.length;
    }
}

export default React.createContext(new MutationQueue());
