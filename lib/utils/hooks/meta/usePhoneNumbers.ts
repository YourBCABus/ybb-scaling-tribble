import { NumberEntry, PhoneNumber } from "@utils/general/phonenumbers";
import { useMemo } from "react";


type RemoveCallback<T> = (data: { graphData: string[] } & T) => Promise<unknown>;

export interface Phone {
    number: PhoneNumber;
    change: Change;
    callback: () => Promise<unknown>;
}
type Phones = Phone[];

export interface Change {
    before: NumberEntry;
    after: NumberEntry;
}
export type RemoveNumCallback = RemoveCallback<{ change: Change, number: PhoneNumber }>;

export interface Entry {
    entry: NumberEntry,
    callback: () => Promise<unknown>;
}
type Entries = Entry[];
export type RemoveEntryCallback = RemoveCallback<{ removed: NumberEntry }>;


interface EntryInfo {
    entry: NumberEntry;
    index: number;
    entries: string[];
}

const withIndex = <T>(arr: T[], index: number, value: T) => {
    const newArr = [...arr];
    newArr[index] = value;
    return newArr;
};
const withRemovedIndex = <T>(arr: T[], index: number) => {
    const newArr = [...arr];
    newArr.splice(index, 1);
    return newArr;
};



const mapNumber = (
    {entry, index, entries}: EntryInfo,
    number: PhoneNumber,
    removeNum: RemoveNumCallback,
): Phone => {
    const withRemoved = new NumberEntry(number.splice(entry.data));
    const change = { before: entry, after: withRemoved };
    return {
        number,
        change,
        callback: () => removeNum({
            number,
            graphData: withIndex(entries, index, withRemoved.data),
            change,
        }),
    };
};

const mapEntryToNums = (
    info: EntryInfo,
    removeNum: RemoveNumCallback,
): Phone[] => info.entry.numbers.map(
    number => mapNumber(info, number, removeNum),
);



const getEntry = (
    {entry, index, entries}: EntryInfo,
    removeEntry: RemoveEntryCallback,
): Entry => {
    return {
        entry,
        callback: () => removeEntry({
            removed: entry,
            graphData: withRemovedIndex(entries, index),
        }),
    };
};

const usePhoneNumbers = (
    entries: string[],
    removeNum: RemoveNumCallback,
    removeEntry: RemoveEntryCallback,
): { phones: Phones, raw: Entries } => {
    const phoneNumbers = useMemo(
        () => entries
            .map(str => new NumberEntry(str))
            .flatMap((entry, index) => mapEntryToNums({ entry, index, entries }, removeNum)),
        [entries, removeNum],
    );

    const numberEntries = useMemo(
        () => entries
            .map(str => new NumberEntry(str))
            .map((entry, index) => getEntry({ entry, index, entries }, removeEntry)),
        [entries, removeEntry],
    );
    console.log(numberEntries);

    const returnValue = useMemo(
        () => ({ phones: phoneNumbers, raw: numberEntries }),
        [phoneNumbers, numberEntries],
    );

    return returnValue;
};

export default usePhoneNumbers;
