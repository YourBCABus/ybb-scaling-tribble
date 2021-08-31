import { GetServerSideProps, GetStaticProps } from "next";

export type PromiseType<T> = T extends PromiseLike<infer U> ? PromiseType<U> : T;
export type Props<T extends GetServerSideProps | GetStaticProps>
  = T extends GetServerSideProps<infer P, any> ? P : (T extends GetStaticProps<infer P, any> ? P : never);

export interface Point {
    lat: number;
    long: number;
}
