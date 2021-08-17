import { gql } from '@apollo/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';
import client from '../../lib/apollo-client';
import { UpdateBusStatus } from './__generated__/UpdateBusStatus';

export const UPDATE_BUS_STATUS = gql`
mutation UpdateBusStatus($busID: ID!, $busStatus: BusStatusInput!) {
    updateBusStatus(
        busID: $busID,
        status: $busStatus
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
        if (req.query.id && req.query.boardingArea && typeof req.query.id === 'string' && typeof req.query.boardingArea === 'string') {

            var invalidateTime = new Date();
            invalidateTime.setUTCHours(24,0,0,0);

            let boardingArea: string | null = req.query.boardingArea;

            if (boardingArea === "" || boardingArea === "?") {
                boardingArea = null;

                invalidateTime = new Date();
            }

            try {
                const { data } = await client.mutate<UpdateBusStatus>({mutation: UPDATE_BUS_STATUS, variables: {busID: req.query.id, busStatus: {invalidateTime, boardingArea}}, context: {req}});
                res.status(200).send(data);
            } catch (e) {
                console.log(e);
                res.status(403).end();
            }
        }
        
    } else res.status(400).end();
}
