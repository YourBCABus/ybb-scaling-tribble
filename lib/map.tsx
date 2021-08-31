import { Point } from "./utils";
import { createContext, useContext } from "react";

import GoogleMapReact, { fitBounds } from "google-map-react";

export interface MappingData {
    boundingBoxA: Point;
    boundingBoxB: Point;
    boardingAreas: {name: string, location: Point}[];
}

interface MapProps {
    mappingData: MappingData;
}

export interface MapContext {
    key?: string;
}

export const MapContext = createContext<MapContext>({});

export default function Map({mappingData}: MapProps) {
    const { key } = useContext(MapContext);

    const size = {width: 640, height: 640}; // TODO: Actually calculate this
    const { center, zoom } = fitBounds({
        ne: {
            lat: Math.max(mappingData.boundingBoxA.lat, mappingData.boundingBoxB.lat),
            lng: Math.max(mappingData.boundingBoxA.long, mappingData.boundingBoxB.long),
        },
        sw: {
            lat: Math.min(mappingData.boundingBoxA.lat, mappingData.boundingBoxB.lat),
            lng: Math.min(mappingData.boundingBoxA.long, mappingData.boundingBoxB.long),
        },
    }, size);

    return <GoogleMapReact
        bootstrapURLKeys={{key: key ?? ""}}
        defaultCenter={center}
        defaultZoom={zoom}
    >
        
    </GoogleMapReact>;
}
