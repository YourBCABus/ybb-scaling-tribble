import { ApolloError, gql } from '@apollo/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { UpdateStopOrder_GetBus, UpdateStopOrder_GetBus_bus_stops } from '__generated__/UpdateStopOrder_GetBus';
import type { UpdateStopOrder_SetStop } from '__generated__/UpdateStopOrder_SetStop';
import createNewClient from 'lib/utils/librarystuff/apollo-client';

export const UPDATE_STOP_ORDER_GET_BUS = gql`
query UpdateStopOrder_GetBus($busID: ID!) {
    bus(id: $busID) {
        stops {
            id
            name,
            description
            location {
                lat
                long
            }
            order
            arrivalTime
            invalidateTime
            available
        }
    }
}
`;

export const UPDATE_STOP_ORDER_SET_STOP = gql`
mutation UpdateStopOrder_SetStop($stopID: ID!, $stopData: StopInput!) {
    updateStop(
        stopID: $stopID,
        stop: $stopData
    ) {
        id,
        busID,
        name,
        description
        location {
            lat
            long
        }
        order
        arrivalTime
        invalidateTime
        available
    }
}
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === "GET") {
        if (req.query.busId && req.query.stopOrderData && typeof req.query.busId === 'string' && typeof req.query.stopOrderData === 'string') {
            const stopOrderData: string[] = JSON.parse(req.query.stopOrderData);

            const client = createNewClient();
            let currentBusStops: UpdateStopOrder_GetBus_bus_stops[];
            try {
                const { data: { bus } } = await client.query<UpdateStopOrder_GetBus>({query: UPDATE_STOP_ORDER_GET_BUS, variables: {busID: req.query.busId}, context: {req}});
                if (!bus) throw new Error("query failed successfully");
                currentBusStops = bus.stops;
            } catch (e) {
                console.error(e);
                res.status(403).send("403 FORBIDDEN");
                return;
            }

            const currentBusStopIds = currentBusStops.map((stop) => stop.id);
            try {
                stopOrderData.map((id) => {if (!currentBusStopIds.includes(id)) throw new Error("Stop ID found that does not exist within bus's stops.");});
            } catch (e) {
                res.status(400).send("400 BAD REQUEST");
                return;
            }

            try {
                res.status(200).json(
                    await Promise.all(currentBusStops.map(({id, name, description, location, arrivalTime, available}) => {
                        return client.mutate<UpdateStopOrder_SetStop>({
                            mutation: UPDATE_STOP_ORDER_SET_STOP,
                            variables: {
                                stopID: id,
                                stopData: {
                                    name,
                                    description,
                                    location: location && {lat: location.lat, long: location.long},
                                    arrivalTime,
                                    order: stopOrderData.indexOf(id),
                                    available,
                                },
                            },
                            context: {req},
                        });
                    }))
                );
            } catch (e) {
                if (e instanceof ApolloError) {
                    if (e.networkError) {
                        const networkError = e.networkError;

                        Object
                            .values(networkError)
                            .forEach(([key, val]) => {
                                if (key === "result") {
                                    console.error(val);
                                }
                            });
                    }
                }
                res.status(403).send("403 FORBIDDEN");
            }

        } else res.status(400).send("400 BAD REQUEST");
    } else res.status(405).send("405 METHOD NOT ALLOWED");
}
