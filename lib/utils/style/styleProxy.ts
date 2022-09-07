export namespace General {
    export type BasicRecord = Record<string, string | undefined>;
    
    export type BasicRecordTo<T> = Record<string, T>;

    export const wrapSpecialKey = "builder" as const;
    export const wrapBuilderSpecialKey = "build" as const;
    export const wrapBuilderIfClause = "IF" as const;
}

export namespace CamelCase {
    type BasicRecord = General.BasicRecord;
    type BasicRecordTo<T> = General.BasicRecordTo<T>;

    const camelCaseConvert = (str: string, sep: string = "_") => str.replace(/[A-Z]/g, letter => `${sep ?? "_"}${letter.toLowerCase()}`);
    const getCamelCaseVal = (record: BasicRecord, targetKey: string) => (
        `__${targetKey}` in record ? record[`__${targetKey}`] : record[`__${camelCaseConvert(targetKey, "-")}`]
    );

    namespace WrapperBuilder {

        const wrapBuilderSpecialKey = General.wrapBuilderSpecialKey;
        const wrapBuilderIfClause = General.wrapBuilderIfClause;

        type ControlMethods = typeof wrapBuilderSpecialKey | typeof wrapBuilderIfClause;

        type CamelCaseValue = ReturnType<typeof getCamelCaseVal>;

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
            skipNext: boolean = false,
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
    }

    namespace Wrapper {
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
    }

    export const wrapCamelCase = Wrapper.wrapCamelCase;
}
