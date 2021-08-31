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
            .then(async () => { for (; this.queue.length > 0; ) await this.queue.shift()?.(); })
            .then(() => { this.promise = this.generatePromise(); });
    }
}

export default React.createContext(new MutationQueue());
