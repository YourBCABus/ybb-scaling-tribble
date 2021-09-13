import { gql } from '@apollo/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import createNewClient from '../../lib/apollo-client';
import { CreateBus } from '../../__generated__/CreateBus';

export const CLEAR_ALL = gql`
mutation ClearAll($schoolID: ID!) {
    clearAll(
        schoolID: $schoolID,
    )
}
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === "GET") {
        if (req.query && typeof req.query.schoolId === 'string') {
            const client = createNewClient();
            try {
                const { data } = await client.mutate<CreateBus>({ mutation: CLEAR_ALL, variables: { schoolID: req.query.schoolId }, context: { req } });
                res.send(data);
            } catch (e) {
                console.log(e);
                res.status(403).send("403 FORBIDDEN");
            }
        } else res.status(400).send("400 BAD REQUEST");
    } else res.status(405).send("405 METHOD NOT ALLOWED");
}
