import { GetServerSideProps, GetStaticProps } from "next";
import { useCallback, useState } from "react";

export type PromiseType<T> = T extends PromiseLike<infer U> ? PromiseType<U> : T;
export type Props<T extends GetServerSideProps | GetStaticProps>
  = T extends GetServerSideProps<infer P, any> ? P : (T extends GetStaticProps<infer P, any> ? P : never);

export function migrateOldStarredBuses(): string[] {
    const oldBusJSON = localStorage.getItem("ngx-webstorage|ybbstarredbuses");
    if (oldBusJSON) {
        try {
            const parsed = JSON.parse(oldBusJSON);
            if (!(parsed instanceof Array)) throw new Error("Old starred buses is not an array");
            localStorage.removeItem("ngx-webstorage|ybbstarredbuses");
            return parsed;
        } catch (e) {
            console.log("Unable to parse old starred buses");
            console.error(e);
        }
    }
    return [];
}

export function useRefWithRerender<T extends HTMLElement>(): [T | null, (node: T) => void] {
    const [el, setEl] = useState<T | null>(null);
    const ref = useCallback((node: T) => {
        if (node !== null) {
            setEl(node);
        }
    }, []);
    return [el, ref];
}
