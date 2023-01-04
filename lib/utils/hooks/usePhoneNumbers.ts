import { NumberEntry, PhoneNumber } from "@utils/general/phonenumbers";
import { useMemo } from "react";


export interface Change {
    before: NumberEntry;
    after: NumberEntry;
}
export type SaveNumbersCallback = (data: { graphData: string[], change: Change, number: PhoneNumber }) => Promise<unknown>;


interface MapNumberArgs {
    entry: NumberEntry;
    index: number;
    number: PhoneNumber;
    entries: string[];
    savePhoneNumbers: SaveNumbersCallback;
}

interface MapEntryArgs {
    entry: NumberEntry;
    index: number;
    entries: string[];
    savePhoneNumbers: SaveNumbersCallback;
}

const withIndex = <T>(arr: T[], index: number, value: T) => {
    const newArr = [...arr];
    newArr[index] = value;
    return newArr;
};


const mapNumber = ({entry, index, number, entries, savePhoneNumbers}: MapNumberArgs) => {
    const withRemoved = new NumberEntry(number.splice(entry.data));
    const change = { before: entry, after: withRemoved };
    return {
        number,
        entryChange: change,
        callback: () => savePhoneNumbers({
            number,
            graphData: withIndex(entries, index, withRemoved.data),
            change,
        }),
    };
};


const mapEntry = ({entry, index, entries, savePhoneNumbers}: MapEntryArgs) =>  entry.numbers.map(
    number => mapNumber({ entry, index, number, entries, savePhoneNumbers }),
);

const usePhoneNumbers = (entries: string[], savePhoneNumbers: SaveNumbersCallback) => {
    const phoneNumbers = useMemo(
        () => entries
            .map(str => new NumberEntry(str))
            .flatMap((entry, index) => mapEntry({ entry, index, entries, savePhoneNumbers })),
        [entries, savePhoneNumbers],
    );

    return phoneNumbers;
};

export default usePhoneNumbers;
