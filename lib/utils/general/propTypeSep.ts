type NestedKeyOf<ObjectType extends Record<string, any>> = {
    [Key in keyof ObjectType]: Key extends string
        ? ObjectType[Key] extends object
            ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
            : Key
        : {}
}[keyof ObjectType & (string)];

type UnionToIntersection<U> = 
    (
        U extends any
            ? (k: U)=>void
            : never
    ) extends (
        (k: infer I) => void
    )
        ? I
        : never;

type BoundedMappedKey<Key extends string | number | symbol, Prefix extends string> =
    Key extends string
        ? Prefix extends ""
            ? `${Key}`
            : `${Prefix}.${Key}`
        : never;

type Mapper<Obj extends Record<string, any>, KeyPrefix extends string> = {
    [Key in keyof Obj as BoundedMappedKey<Key, KeyPrefix>]: Obj[Key];
};

type BoundedNestedKeyRecursive<Value, Prefix extends string, Limit extends string> = (
    Value extends Record<string, any>
        ? NestedKeyOfWithValueRecursive<Value, Prefix, Limit>
        : never
);

type BoundedNestedValidKey<
    Key extends string | number | symbol, Prefix extends string, ObjectType extends Record<string, any>
> = (
    Key extends string
        ? Key extends keyof ObjectType
            ? ObjectType[Key] extends Record<string, any>
                ? BoundedMappedKey<Key, Prefix>
                : never
            : never
        : never
);

type NestedKeyOfWithValueRecursive<ObjectType extends Record<string, any>, Prefix extends string, Limit extends string> = (
    Limit extends "999999999"
        ? { overloaded: true }
        : Mapper<ObjectType, Prefix> & UnionToIntersection<{
            [
                Key in keyof ObjectType
                    as BoundedNestedValidKey<Key, Prefix, ObjectType>
            ]: BoundedNestedKeyRecursive<ObjectType[Key], BoundedMappedKey<Key, Prefix>, `${Limit}9`>;
        }[BoundedNestedValidKey<keyof ObjectType, Prefix, ObjectType>]>
);
    
export type NestedKeyOfWithValue<ObjectType extends Record<string, any>> = NestedKeyOfWithValueRecursive<ObjectType, "", "">;

// type TestType = NestedKeyOfWithValue<BusProps>;
// type Alias = NestedKeyOfWithValue<BusProps>["bus.__typename"];


type InputTypeAlias<B, T extends Record<string, any>> = B extends InputType<never> ? Record<string, NestedKeyOf<T> | InputType<T>> : never;
export interface InputType<T extends Record<string, any>> extends InputTypeAlias<InputType<never>, T> { }

export type MapType<ToMap extends Record<string, any>, MappingType extends InputType<ToMap>> = {
    [
        Key in keyof MappingType
            as Key extends string ? Key : never
    ]: (
        Key extends string
            ? MappingType[Key] extends Record<string, any>
                ? MapType<ToMap, MappingType[Key]>
                : MappingType[Key] extends string
                    ? NestedKeyOfWithValue<ToMap>[MappingType[Key]]
                    : never
            : never
    )
}; 

const getNestedProp = <
    T extends Record<string, any>,
    K extends NestedKeyOf<T>,
>(data: T, nestedKey: K) => {
    let currVal = data;
    for (let key of nestedKey.split(".")) {
        currVal = currVal[key];
    }
    return currVal;
};

// TODO: Check type safety!
const mapObject = <
    T extends Record<string, any>,
    M extends InputType<T>,
>(data: T, mappingObj: M): MapType<T, M> => {
    const newObj = {} as MapType<T, M>; 
    for (const key in mappingObj) {
        const x = mappingObj[key];
        if (typeof x !== "string") {
            // @ts-ignore
            newObj[key] = mapObject(data, x);
        } else if (typeof x === "string") {
            // @ts-ignore
            newObj[key] = getNestedProp(data, x);
        }
    }
    return newObj;
};
// const mapObj = {
//     bus: "bus",
//     text: {
//         name: "bus.name",
//         boardingArea: "bus.boardingArea",
//         invalidateTime: "bus.invalidateTime",
//     },
// } as const;

// const x: MapType<BusProps, typeof mapObj> = {
//     bus: {
//         __typename: "Bus",
//         id: "",
//         name: "",
//         boardingArea: "",
//         invalidateTime: 0,
//         available: false,
//     },
//     text: {
//         name: "never",
//         invalidateTime: 0,
//         boardingArea: "",
//     },
// };

export default mapObject;
