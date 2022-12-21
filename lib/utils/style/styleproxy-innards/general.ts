export type BasicRecord = Record<string, string | undefined>;
    
export type BasicRecordTo<T> = Record<string, T>;

export const wrapSpecialKey = "builder" as const;
export const wrapBuilderSpecialKey = "build" as const;
export const wrapBuilderIfClause = "IF" as const;
