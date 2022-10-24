import { useEffect } from "react";

// TODO: Check for exhaustiveness!
const useInterval = <T extends unknown[]>(interval: number, func: (...params: T) => void, ...inputs: T) => {
    useEffect(() => {
        if (interval === 0) {
            return () => void 0;
        } else {
            const intervalHandle = setInterval(() => func(...inputs), interval);
            return () => clearInterval(intervalHandle);
        }
    }, [interval, func, ...inputs]); // eslint-disable-line
};

export default useInterval;
