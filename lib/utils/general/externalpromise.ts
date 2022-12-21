export class ExternalPromise<T, E> {
    private callResolve: (value: T) => void;
    private callReject: (value: E) => void;

    private internalPromise: Promise<T>;

    public constructor() {
        this.internalPromise = new Promise((res, rej) => {
            this.callResolve = res;
            this.callReject = rej;
        });

        this.callResolve ??= () => console.error("help please res");
        this.callReject  ??= () => console.error("help please rej");
    }

    public resolve(value: T) {
        this.callResolve(value);
    }

    public reject(value: E) {
        this.callReject(value);
    }

    public get promise() {
        return this.internalPromise;
    }
}
