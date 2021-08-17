import createNewClient from "../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchools } from "./__generated__/GetSchools";
import { Props } from "../lib/utils";

export const GET_SCHOOLS = gql`
query GetSchools {
    schools {
        id
        name
        readable
    }
}
`;

export default function Schools({ schools }: Props<typeof getServerSideProps>) {
    return (
        <div>
            <h1>Schools</h1>
            <ul>
                {schools.map(school => {
                    return <li key={school.id}>
                        <a href={school.readable ? `/school/${school.id}` : `javascript:void(0)`}>
                            {school.name} ({school.readable ? "Readable" : "Not Readable"})
                        </a>
                    </li>;
                })}
            </ul>
        </div>
    );
}

export async function getServerSideProps() {
    const client = createNewClient();
    const { data } = await client.query<GetSchools>({query: GET_SCHOOLS});
    return {props: {schools: data.schools}};
}
