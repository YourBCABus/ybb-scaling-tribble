import client from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchool } from "./__generated__/GetSchool";
import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { ApolloError } from "@apollo/client";

export const GET_SCHOOL = gql`
query GetSchool($id: ID!) {
    school(id: $id) {
        id,
        name,
        location {
            lat,
            long
        },
        available
    }
}
`;

export default function School({ school: schoolOrUndef }: Props<typeof getServerSideProps>) {
    let school = schoolOrUndef!;
    return (
        <div>
            <h1>{school.name}</h1>
            {school.location === null ? <p>Unknown location.</p> : <p>Latitude: {school.location?.lat}, Longitude: {school.location?.long}</p>}
            <p>Internal School ID: {school.id}</p>
            <p>School is {school.available ? "" : "not "}available.</p>
        </div>
    );
}

export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {
    let data: GetSchool | null = null;
    try {
        const { data: scopedData } = await client.query<GetSchool>({query: GET_SCHOOL, variables: {id: context.params!.schoolId}});
        data = scopedData;
    } catch (e) {
        if (e instanceof ApolloError) {
            e.clientErrors.map((error) => console.log(error.name));
        } else throw e;
    }
    
    return data?.school == null ? {notFound: true, props: {}} : {props: {school: data.school}};
};
