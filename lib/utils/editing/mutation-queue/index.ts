import React from "react";
import { ExternalPromise } from "@general-utils/externalpromise";

import { createBus, CreateBus, deleteBus, DeleteBus } from "./create-delete-bus";

import updateBoardingArea, { UpdateBoardingArea } from "./update-boarding-area";
import { updateBusName, UpdateBusName, updateBusActivation, UpdateBusActivation } from "./update-bus";
import clearAll, { ClearAll } from "./clear-all";

export enum MutationType {
    UP_B_BOARD, UP_B_NAME, UP_B_ACT,
    CR_B, DL_B,
    CL_ALL,
}

export type Mutation = UpdateBoardingArea | UpdateBusName | UpdateBusActivation | CreateBus | DeleteBus | ClearAll;


type MutationResult = ExternalPromise<Response, Error>;

const wrapTryN = <T extends (...inputs: P) => Promise<Response>, P extends unknown[]>(fn: T, tryCount: number) => (...inputs: P) => {
    const ret: MutationResult = new ExternalPromise();
    (async () => {
        console.log({ inputs, fn, tryCount });

        let currError: Error | undefined;
        for (let i = 0; i < tryCount; i++) {
            try {
                const output = await fn(...inputs);
                console.log(output);
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

    [MutationType.CR_B]: (mutation: CreateBus) => ExternalPromise<Response, Error>;
    [MutationType.DL_B]: (mutation: DeleteBus) => ExternalPromise<Response, Error>;

    [MutationType.CL_ALL]: (mutation: ClearAll) => ExternalPromise<Response, Error>;
};

const mutationMap: MutationHandlerMap = {
    [MutationType.UP_B_BOARD]: wrapTryN(updateBoardingArea, 3),
    [MutationType.UP_B_NAME]: wrapTryN(updateBusName, 3),
    [MutationType.UP_B_ACT]: wrapTryN(updateBusActivation, 3),
    [MutationType.CR_B]: wrapTryN(createBus, 1),
    [MutationType.DL_B]: wrapTryN(deleteBus, 3),
    [MutationType.CL_ALL]: wrapTryN(clearAll, 3),
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
