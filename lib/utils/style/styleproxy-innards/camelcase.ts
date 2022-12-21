import * as General from "./general";

import * as Wrapper from "./camelcaseinnards/wrapper";
import * as WrapperBuilder from "./camelcaseinnards/wrapperbuilder";

export type BasicRecord = General.BasicRecord;
export type BasicRecordTo<T> = General.BasicRecordTo<T>;

export const camelCaseConvert = (str: string, sep = "_") => str.replace(/[A-Z]/g, letter => `${sep ?? "_"}${letter.toLowerCase()}`);
export const getCamelCaseVal = (record: BasicRecord, targetKey: string) => (
    `__${targetKey}` in record ? record[`__${targetKey}`] : record[`__${camelCaseConvert(targetKey, "-")}`]
);


export const wrapCamelCase = Wrapper.wrapCamelCase;

export { Wrapper, WrapperBuilder };
