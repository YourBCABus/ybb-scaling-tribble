import React from "react";

export class MutationQueue {
    private queue: (() => Promise<void>)[];
    private promise: Promise<void>;
    private resolve?: (value?: undefined) => void;
    
    constructor() {
        this.queue = [];
        this.promise = this.generatePromise();

    }

    addToQueue(mutationToAdd: () => Promise<void>): void {
        this.queue.push(mutationToAdd);
    }

    resolvePromise(): void {
        this.resolve?.();
    }

    private generatePromise(): Promise<void> {
        return new Promise((resolve, _) => { this.resolve = resolve; })
            .then(async () => {
                for (; this.queue.length > 0; ) {
                    let currMutation = this.queue.shift();
                    if (currMutation) {
                        for (const _ in Array(3).fill(undefined)) {
                            try {
                                await currMutation();
                                break;
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                }
            })
            .then(() => { this.promise = this.generatePromise(); });
    }

    get length() {
        return this.queue.length;
    }
}

export default React.createContext(new MutationQueue());
