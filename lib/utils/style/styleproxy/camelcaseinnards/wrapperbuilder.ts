import * as General from "../general";

import { getCamelCaseVal, BasicRecord, BasicRecordTo } from "../camelcase";

const wrapBuilderSpecialKey = General.wrapBuilderSpecialKey;
const wrapBuilderIfClause = General.wrapBuilderIfClause;

type ControlMethods = typeof wrapBuilderSpecialKey | typeof wrapBuilderIfClause;

type BasicMapping = Omit<BasicRecord, ControlMethods> & {[key in ControlMethods]: null};

type WrapCamelCaseBuilderInnards = Omit<BasicRecordTo<WrapCamelCaseBuilder>, ControlMethods> & {
    [wrapBuilderSpecialKey]: () => string;
    [wrapBuilderIfClause]: ReturnType<typeof ifClauseFunc>;
};
export type WrapCamelCaseBuilder = {
    [x in keyof BasicMapping]: WrapCamelCaseBuilderInnards[x];
} & (() => string);

const joinSet = (set: Set<string>) => () => Array.from(set).join(" ");

const ifClauseFunc = (inputStyles: BasicRecord, currentSelection: Set<string>) =>
    (condition: unknown) => 
        wrapCamelCaseBuilder(inputStyles, currentSelection, !Boolean(condition));

export const wrapCamelCaseBuilder = (
    inputStyles: BasicRecord,
    currentSelection: Set<string>,
    skipNext = false,
): Readonly<WrapCamelCaseBuilder> => {
    return Object.freeze(new Proxy<BasicRecord>(Object.assign(joinSet(currentSelection), inputStyles), {
        get: (target: BasicRecord, key: string | symbol) => {
            if (key === wrapBuilderSpecialKey) return joinSet(currentSelection);
            else if (key === wrapBuilderIfClause) return ifClauseFunc(inputStyles, currentSelection);
            else if (typeof key !== "string") return undefined;
            
            const newSelection = new Set(currentSelection);
            const newValue = getCamelCaseVal(target, key);
            
            if (newValue !== undefined && !skipNext) newSelection.add(newValue);

            return wrapCamelCaseBuilder(inputStyles, newSelection);
        },
    }) as unknown as WrapCamelCaseBuilder);
};
