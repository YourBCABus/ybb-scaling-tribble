import { useEffect } from "react";

// TODO: Check for exhaustiveness!
const useInterval = <T extends any[]>(interval: number, func: (...params: T) => void, ...inputs: T) => {
    useEffect(() => {
        const intervalHandle = setInterval(() => func(...inputs), interval);
        return () => clearInterval(intervalHandle);
    }, [interval, func, ...inputs]); // eslint-disable-line
};

export default useInterval;
