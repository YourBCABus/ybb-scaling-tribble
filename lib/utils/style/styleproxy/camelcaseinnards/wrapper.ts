import * as General from "../general";

import { BasicRecord, getCamelCaseVal } from "../camelcase";
import * as WrapperBuilder from "./wrapperbuilder";

const wrapSpecialKey = General.wrapSpecialKey;

export type WrapCamelCase = Omit<BasicRecord, typeof wrapSpecialKey> & { [wrapSpecialKey]: () => WrapperBuilder.WrapCamelCaseBuilder };

export const wrapCamelCase = (inputStyles: BasicRecord): Readonly<[Readonly<WrapCamelCase>, Readonly<WrapperBuilder.WrapCamelCaseBuilder>]> => {
    const inputObj = Object.fromEntries(
        Object
            .entries(inputStyles)
            .map(
                ([name, className]) => [`__${name}`, className],
            ),
    );
    const wrapped = Object.freeze(new Proxy<BasicRecord>(inputObj, {
        get: (target: BasicRecord, key: string | symbol) => {
            if (key === wrapSpecialKey) return () => WrapperBuilder.wrapCamelCaseBuilder(target, new Set());
            else if (typeof key !== "string") return undefined;
            return getCamelCaseVal(target, key);
        },
    }) as WrapCamelCase);

    return [wrapped, wrapped.builder()];
};
