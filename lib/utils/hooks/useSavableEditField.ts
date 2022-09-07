import { useCallback, useMemo, useState } from "react";

type Optional<T> = { isSome: true, value: T } | { isSome: false};

export interface SavableEditField<T, O> {
    value: T;
    edit: {
        setTemp: (newName: T) => void;
        save: () => Promise<O> | undefined;
        clearTemp: () => boolean;
    };
}
export interface ReadonlyEditField<T> {
    value: T;
    edit: undefined;
}

const useSavableEditField = <T, O>(saved: T, saveFunction?: (input: T) => Promise<O>): SavableEditField<T, O> | ReadonlyEditField<T> => {

    const [edited, setEdited] = useState<Optional<T>>({ isSome: false });
    const [savedSinceEdit, setSavedSinceEdit] = useState(true);


    const value = useMemo(() => edited.isSome ? edited.value : saved, [edited, saved]);
    const setTemp = useCallback((newName: T) => {
        setEdited({isSome: true, value: newName});
        setSavedSinceEdit(false);
    }, []);
    const save = useCallback(() => {
        if (edited.isSome) return saveFunction?.(edited.value).then(val => {
            setSavedSinceEdit(true);
            return val;
        });
    }, [edited, saveFunction]);
    const clearTemp = useCallback(() => {
        if (savedSinceEdit) {
            setEdited({ isSome: false });
            return true;
        } else {
            return false;
        }
    }, [savedSinceEdit]);

    const output = useMemo(
        () => ({
            value,
            edit: {
                setTemp,
                save,
                clearTemp,
            },
        }),
        [
            value,
            setTemp,
            save,
            clearTemp,
        ],
    );

    if (!saveFunction) return {
        value,
        edit: undefined,
    };

    return output;
};

export default useSavableEditField;
