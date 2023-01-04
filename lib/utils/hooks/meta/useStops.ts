import { GetBus_bus_stops } from "@graph-types/GetBus";
import { useMemo } from "react";

export class StopId {
    public constructor(private id: string) {}

    public equals(other: string): boolean {
        return this.id === other;
    }

    public eq(other: StopId): boolean {
        return this.id === other.id;
    }

    public toString() {
        return this.id;
    }
}

export class BusStop {
    private _id: StopId;
    private _name: string;
    private _description: string;
    private _location?: { lat: number, long: number };
    private _order: number;

    public constructor(id: StopId, name: string, description: string, location: { lat: number, long: number } | null, order: number | null) {
    	this._id = id;
        this._name = name;
        this._description = description;
        this._location = location ?? undefined;
        this._order = order ?? Infinity;
    }

    public compare(other: BusStop) {
        return this._order - other._order;
    }
}



// __typename: "Stop";
// id: string;
// name: string | null;
// description: string | null;
// location: GetBus_bus_stops_location | null;
// order: number | null;

const useStops = (graphStops: GetBus_bus_stops[]): BusStop[] => {
    const processedPerms = useMemo<BusStop[]>(
        () => graphStops.map(stop => new BusStop(
            new StopId(stop.id),
            stop.name ?? "",
            stop.description ?? "",
            stop.location,
            stop.order,
        )).sort((a, b) => a.compare(b)),
        [graphStops],
    );

    return processedPerms;
};

export default useStops;
