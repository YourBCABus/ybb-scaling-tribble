import { useMemo } from "react";

const useMemoMap = <T, O>(arr: readonly T[], mapFunc: (input: T) => O) => {
    return useMemo(() => arr.map(mapFunc), [arr, mapFunc]);
};

export default useMemoMap;
