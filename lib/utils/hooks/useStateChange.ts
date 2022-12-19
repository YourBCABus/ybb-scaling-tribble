import { useCallback, useEffect, useState } from "react";

const useStateChange = <S>(useStateParam: S | (() => S), onChange: (oldVal: S, newVal: S) => void) => {
    const [value, rawSetFunc] = useState(useStateParam);

    const valSetFunc = useCallback((newValue: S) => {
        onChange(value, newValue);
        rawSetFunc(newValue);
    }, [onChange, value]);

    return [value, valSetFunc] as const;
};

export const useStateChangeClientSide = <S>(
    useStateParam: S | (() => S),
    onChange: (oldVal: S, newVal: S) => void,
    defaultServerSide: S,
) => {
    const [value, rawSetFunc] = useState<S>(defaultServerSide);

    const valSetFunc = useCallback((newValue: S) => {
        onChange(value, newValue);
        rawSetFunc(newValue);
    }, [onChange, value]);

    useEffect(
        () => rawSetFunc(useStateParam),
        [useStateParam],
    );

    return [value, valSetFunc] as const;
};

export default useStateChange;

