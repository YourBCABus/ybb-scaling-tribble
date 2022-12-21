import { useCallback, useMemo, useState } from "react";

type Optional<T> = { isSome: true, value: T } | { isSome: false};

export interface SavableEditField<T, O> {
    value: T;
    edit: {
        setTemp: (newName: T) => void;
        save: () => Promise<O> | undefined;
        clearTemp: () => boolean;
        saveImmediate: (newName: T) => Promise<O> | undefined;
    };
}
export interface ReadonlyEditField<T> {
    value: T;
    edit: undefined;
}

export type EditField<T, O> = SavableEditField<T, O> | ReadonlyEditField<T>;

const useSavableEditField = <T, O>(saved: T, saveFunction?: (input: T) => Promise<O>): EditField<T, O> => {
    const [edited, setEdited] = useState<Optional<T>>({ isSome: false });
    const [savedSinceEdit, setSavedSinceEdit] = useState(true);


    const value = useMemo(() => edited.isSome ? edited.value : saved, [edited, saved]);
    const setTemp = useCallback((newName: T) => {
        setEdited({isSome: true, value: newName});
        setSavedSinceEdit(false);
    }, []);
    const save = useCallback(() => {
        if (!savedSinceEdit) return saveFunction?.(value).then(val => {
            setSavedSinceEdit(true);
            return val;
        });
    }, [value, saveFunction, savedSinceEdit]);
    const clearTemp = useCallback(() => {
        if (savedSinceEdit) {
            setEdited({ isSome: false });
            return true;
        } else {
            return false;
        }
    }, [savedSinceEdit]);


    const saveImmediate = useCallback((saveValue: T) => {
        return saveFunction?.(saveValue).then(val => {
            setSavedSinceEdit(true);
            return val;
        });
    }, [saveFunction]);

    const output = useMemo(
        () => ({
            value,
            edit: {
                setTemp,
                save,
                clearTemp,
                saveImmediate,
            },
        }),
        [
            value,
            setTemp,
            save,
            clearTemp,
            saveImmediate,
        ],
    );

    if (!saveFunction) return {
        value,
        edit: undefined,
    };

    return output;
};

export default useSavableEditField;
