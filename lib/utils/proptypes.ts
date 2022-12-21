import { GetSchoolAndPerms_school_buses, GetSchoolAndPerms_school_mappingData_boardingAreas } from "@graph-types/GetSchoolAndPerms";
import { GetBus_bus } from "@graph-types/GetBus";
import { BusInput } from "@graph-types/globalTypes";

export class BusId {
    public constructor(private id: string) {}

    public equals(other: string): boolean {
        return this.id === other;
    }

    public eq(other: BusId): boolean {
        return this.id === other.id;
    }

    public toString() {
        return this.id;
    }
}

export class SchoolId {
    public constructor(private id: string) {}

    public equals(other: string): boolean {
        return this.id === other;
    }

    public eq(other: SchoolId): boolean {
        return this.id === other.id;
    }

    public toString() {
        return this.id;
    }
}


type BasicBusInitData = GetBus_bus | GetSchoolAndPerms_school_buses;
type ExtraData = { otherNames: string[], company: string | null, phones: string[] };
export class BusData {
    private _id: BusId;
    private _name: string | null;
    private _boardingArea: BoardingArea;
    private _running: boolean;

    private _extra?: ExtraData;


    public constructor(id: BusId, name: string | null, area: BoardingArea, running: boolean, extra?: ExtraData) {
        this._id = id;
        this._name = name;
        this._boardingArea = area;
        this._running = running;
        this._extra = extra;
    }

    private static from(data: BasicBusInitData, extra?: ExtraData) {
        return new BusData(
            new BusId(data.id),
            data.name,
            new BoardingArea(data.boardingArea, data.invalidateTime),
            data.available,
            extra,
        );
    }

    public static fromSchool(data: GetSchoolAndPerms_school_buses) {
        return BusData.from(data);
    }
    public static fromBus(data: GetBus_bus) {
        return BusData.from(
            data,
            { otherNames: data.otherNames, company: data.company, phones: data.phone },
        );
    }

    public get id() {
        return this._id;
    }

    public get name() {
        return this._name ?? "<Unnamed Bus>";
    }

    public get boardingArea() {
        if (this.running) return this._boardingArea.text;
        else return "?";
    }

    public get isArrived() {
        return this.boardingArea !== "?";
    }

    public get running() {
        return this._running;
    }

    public compareName(other: BusData) {
        const defaultBusNameCmpVal = "\u{10FFFD}".repeat(100);
        return (this._name || defaultBusNameCmpVal).localeCompare(other._name || defaultBusNameCmpVal);
    }

    public withArea(area: BoardingArea) {
        return new BusData(this._id, this._name, area, this._running);
    }

    public get input(): BusInput | null {
        if (this._extra) return {
            name: this._name,
            available: this._running,
            
            otherNames: this._extra.otherNames,
            company: this._extra.company,
            phone: this._extra.phones,
        };
        else return null;
    }
}

export class BoardingArea {
    private _boardingArea: string | null;
    private _invalidateTime: Date;

    constructor(boardingArea: string | null, invalidateTime: unknown) {
        this._boardingArea = boardingArea;

        this._invalidateTime = BoardingArea.getInvalidateTimeDate(invalidateTime);
    }

    public get text() {
        if (Date.now() < this._invalidateTime.getTime() && this._boardingArea) return this._boardingArea;
        else return "?";
    }

    private static getInvalidateTimeDate(invalidateTime: unknown): Date {
        if (typeof invalidateTime === 'string' || typeof invalidateTime === 'number') {
            return new Date(invalidateTime);
        } else if (typeof invalidateTime === 'object' && invalidateTime !== null && invalidateTime instanceof Date) {
            return new Date(invalidateTime);
        } else {
            return new Date(0);
        }
    }

    public static dummyValid(name: string) {
        return new BoardingArea(name, Date.now() + 1e10);
    }
}

export class MappingBoardingArea {
    public constructor(private _name: string, private _location?: { lat: number, long: number } ) {}
    
    public static fromGraphQL(data: GetSchoolAndPerms_school_mappingData_boardingAreas) {
        return new MappingBoardingArea(data.name);
    }

    // public static getAssigned(mappingAreas: MappingBoardingArea[], areaNames: string[]): MappingBoardingArea[] {
    //     return mappingAreas.filter(area =>  areaNames.some(areaName => area.equal(areaName)));
    // }
    public static getUnassigned(mappingAreas: MappingBoardingArea[], areaNames: string[]): MappingBoardingArea[] {
        return mappingAreas.filter(area => !areaNames.some(areaName => area.equal(areaName)));
    }

    public equal(otherName: string) {
        if (otherName === "?") return false;
        else return otherName === this._name;
    }

    public get key() {
        return `name: ${this.name}, loc: (${this._location?.lat}, ${this._location?.long})`;
    }

    public get name() {
        return this._name;
    }

    public toDummyArea() {
        return BoardingArea.dummyValid(this._name);
    }
}
