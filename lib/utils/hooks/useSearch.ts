import { useEffect, useState } from "react";

export class SearchFilter<T> {
    public filterActive: boolean;

    public constructor(
        private predicate: (value: T, term: string) => boolean,
        private filterText: string,
        private setCallback: (newFilter: SearchFilter<T>) => void,
    ) {
        this.filterActive = !!filterText;
    }

    public filter(list: readonly T[]): readonly T[] {
        return list.filter(val => this.predicate(val, this.filterText));
    }

    public setTerm(newTerm: string) {
        this.setCallback(new SearchFilter(
            this.predicate,
            newTerm,
            this.setCallback,
        ));
    }


    public get term() {
        return this.filterText;
    }

    public get isFiltering() {
        return this.filterActive;
    }
}

const useSearch = <T>(
    predicate: (value: T, term: string) => boolean,
    defaultValue?: string,
) => {
    const [filterObj, setFilterObj] = useState(new SearchFilter(
        predicate,
        defaultValue ?? "",
        () => void 0,
    ));

    useEffect(
        () => {
            setFilterObj(new SearchFilter(
                predicate,
                defaultValue ?? "",
                setFilterObj,
            ));
        },
        [predicate, defaultValue],
    );

    return filterObj;
};

export default useSearch;
