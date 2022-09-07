import { useMemo } from "react";


// TODO: CHECK THIS FOR EXHAUSTIVENESS.
const useMemoizedBuilder = <T extends any[], O>(builderFunc: (...input: T) => O, ...inputs: T) => {
    return useMemo(() => builderFunc(...inputs), [builderFunc, ...inputs]); // eslint-disable-line
};

export default useMemoizedBuilder;
