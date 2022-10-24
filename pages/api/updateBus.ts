import { gql } from '@apollo/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import createNewClient from 'lib/utils/librarystuff/apollo-client';
import { UpdateBus } from '__generated__/UpdateBus';
import { BusInput } from '__generated__/globalTypes';

export const UPDATE_BUS = gql`
mutation UpdateBus($busID: ID!, $bus: BusInput!) {
    updateBus(
        busID: $busID,
        bus: $bus
    ) {
        id,
        schoolID,
        boardingArea,
        otherNames,
        invalidateTime,
        available,
        name,
        company,
        phone,
        numbers,
    }
}
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === "GET") {
        if (req.query.id && req.query.busData && typeof req.query.id === 'string' && typeof req.query.busData === 'string') {

            const invalidateTime = new Date();
            invalidateTime.setUTCHours(24,0,0,0);

            const bus: BusInput = JSON.parse(req.query.busData);

            const client = createNewClient();
            try {
                const { data } = await client.mutate<UpdateBus>({mutation: UPDATE_BUS, variables: {busID: req.query.id, bus}, context: {req}});
                res.send(data);
            } catch (e) {
                console.log(e);
                res.status(403).send("403 FORBIDDEN");
            }
        } else res.status(400).send("400 BAD REQUEST");
    } else res.status(405).send("405 METHOD NOT ALLOWED");
}
