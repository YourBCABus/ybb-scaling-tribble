import { gql } from '@apollo/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import createNewClient from 'lib/utils/librarystuff/apollo-client';
import { CreateBus } from '__generated__/CreateBus';

export const CREATE_BUS = gql`
mutation CreateBus($schoolID: ID!) {
    createBus(
        schoolID: $schoolID,
        bus: {
            otherNames: [],
            phone: [],
            available: true,
        }
    ) {
        id,
    }
}
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === "GET") {
        if (req.query && typeof req.query.schoolId === 'string') {
            const client = createNewClient();
            try {
                const { data } = await client.mutate<CreateBus>({ mutation: CREATE_BUS, variables: { schoolID: req.query.schoolId }, context: { req } });
                res.send(data);
            } catch (e) {
                console.error(e);
                res.status(403).send("403 FORBIDDEN");
            }
        } else res.status(400).send("400 BAD REQUEST");
    } else res.status(405).send("405 METHOD NOT ALLOWED");
}
