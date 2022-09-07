import { gql } from '@apollo/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import createNewClient from 'lib/utils/apollo-client';
import { DeleteBus } from '__generated__/DeleteBus';

export const DELETE_BUS = gql`
mutation DeleteBus($busID: ID!) {
    deleteBus(busID: $busID),
}
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === "DELETE") {
        if (req.query && typeof req.query.busId === 'string') {
            const client = createNewClient();
            try {
                await client.mutate<DeleteBus>({ mutation: DELETE_BUS, variables: { busID: req.query.busId }, context: { req } });
                res.send({ok: true});
            } catch (e) {
                console.log(e);
                res.status(403).send("403 FORBIDDEN");
            }
        } else res.status(400).send("400 BAD REQUEST");
    } else res.status(405).send("405 METHOD NOT ALLOWED");
}
