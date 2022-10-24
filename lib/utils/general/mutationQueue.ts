import React from "react";

export class MutationQueue {
    private queue: (() => Promise<void>)[];
    private promise: Promise<void>;
    private resolve?: (value?: undefined) => void;
    
    constructor() {
        this.queue = [];
        this.promise = this.generatePromise();

    }

    addToQueue(mutationToAdd: () => Promise<void>): Promise<void> {
        this.queue.push(mutationToAdd);
        return this.promise.then(() => new Promise((resolve) => setTimeout(resolve, 100)));
    }

    resolvePromise(): void {
        this.resolve?.();
    }

    private generatePromise(): Promise<void> {
        return new Promise((resolve) => { this.resolve = resolve; })
            .then(async () => {
                while (this.queue.length > 0) {
                    const currMutation = this.queue.shift();
                    if (currMutation) {
                        this.queue.unshift(currMutation);
                        for (let i = 0; i < 3; i++) {
                            try {
                                await currMutation();
                                break;
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                    this.queue.shift();
                }
            })
            .then(() => { this.promise = this.generatePromise(); });
    }

    get length() {
        return this.queue.length;
    }
}

export default React.createContext(new MutationQueue());
