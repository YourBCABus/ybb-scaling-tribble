import { ExternalPromise } from "@utils/general/externalpromise";
import { useCallback, useState } from "react";


type ConfirmationResult<V> = { confirmed: true, val: Awaited<V> } | { confirmed: false };
interface ConfirmInterface<T extends unknown[], V> {
    confirming: true;
    confirm: () => Promise<void>;
    cancel: () => Promise<void>;

    request: (...inputs: T) => Promise<ConfirmationResult<V>>;

    reset: () => void;

    data: T;
}

interface NotConfirmInterface<T extends unknown[], V> {
    confirming: false;
    request: (...inputs: T) => Promise<ConfirmationResult<V>>;
}

export type ConfirmingData<T extends unknown[], V> = ConfirmInterface<T, V> | NotConfirmInterface<T, V>;

const useConfirm = <T extends unknown[], V extends Promise<unknown>>(
    callback: (...inputs: T) => V,
    autoReset: boolean,
): ConfirmingData<T, V> => {
    const [confirmData, setConfirmData] = useState<{ data: T } | null>(null);

    const [promise, setPromise] = useState(new ExternalPromise<ConfirmationResult<V>, never>());

    const reset = useCallback(() => setConfirmData(null), []);

    const { confirm, cancel } = {
        confirm: useCallback(async () => {
            if (!confirmData) return;
            const output = await callback(...confirmData.data);
            promise.resolve({ confirmed: true, val: output });
            if (autoReset) reset();
        }, [confirmData, promise, callback, reset, autoReset]),
        
        cancel: useCallback(async () => {
            promise.resolve({ confirmed: false });
            reset();
        }, [promise, reset]),        
    };

    const request = useCallback((...input: T) => {
        const promise = new ExternalPromise<ConfirmationResult<V>, never>();
        setPromise(promise);
        setConfirmData({ data: input });
        return promise.promise;
    }, []);

    if (confirmData) return { confirming: true, confirm, cancel, data: confirmData.data, request, reset };
    else return { confirming: false, request };
};

export default useConfirm;
