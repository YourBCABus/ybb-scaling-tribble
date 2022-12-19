import { GetServerSideProps, GetStaticProps } from "next";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { useCallback, useState } from "react";

export type PromiseType<T> = T extends PromiseLike<infer U> ? PromiseType<U> : T;
export type Props<T extends GetServerSideProps | GetStaticProps>
  = T extends GetServerSideProps<infer P, NextParsedUrlQuery> ? P : (T extends GetStaticProps<infer P, NextParsedUrlQuery> ? P : never);

export const useRefWithRerender = <T extends HTMLElement>(): [T | null, (node: T) => void] => {
    const [el, setEl] = useState<T | null>(null);
    const ref = useCallback((node: T) => {
        if (node !== null) {
            setEl(node);
        }
    }, []);
    return [el, ref];
};

export const ifOrUndef = <T>(cond: boolean, value: T) => (
    cond ? value : undefined
);

export const sortDist = (num1: number, num2: number, relativePoint: number) => {
    const num1Dist = Math.abs(num1 - relativePoint);
    const num2Dist = Math.abs(num2 - relativePoint);

    const numNear = num1Dist < num2Dist ? num1 : num2;
    const numFar  = num1Dist > num2Dist ? num1 : num2;

    return [numNear, numFar];
};

export const inBounds = (
    lowerBound: number,
    testNum: number,
    upperBound: number,
) => lowerBound <= testNum && upperBound >= testNum;

export type Immutable<T> = {
    readonly [K in keyof T]: Immutable<T[K]>;
}

export const makeImmut = <T>(input: T): Immutable<T> => input;
