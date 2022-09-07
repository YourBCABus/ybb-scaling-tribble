import createNewClient from "../../../lib/utils/apollo-client";
import gql from "graphql-tag";
import { GetSchoolAndPerms, GetSchoolAndPerms_school_buses } from "../../../__generated__/GetSchoolAndPerms";

import { Props } from "../../../lib/utils/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { MouseEvent } from "react";

import Head from 'next/head';
import { NextSeo } from "next-seo";

export const GET_SCHOOL_AND_PERMS = gql`
query GetSchoolAndPerms($id: ID!) {
    school(id: $id) {
        id
        name
        location {
            lat
            long
        }
        buses {
            id
            name
            boardingArea
            invalidateTime
            available
        }
        mappingData {
            boardingAreas {
                name
            }
        }
    }
    currentSchoolScopes(schoolID: $id) 
}
`;

type SchoolProps = Props<typeof getServerSideProps>;

export default function School({ school: schoolOrUndef }: SchoolProps): JSX.Element {

    return <div>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <NextSeo title={schoolOrUndef?.name ?? "School"} />
        Aaaaaaa
    </div>;
}

export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {    
    const client = createNewClient();
    
    let data: GetSchoolAndPerms | null = null;
    try {
        const { data: scopedData } = await client.query<GetSchoolAndPerms>({query: GET_SCHOOL_AND_PERMS, variables: {id: context.params!.schoolId}, context: {req: context.req}});
        data = scopedData;
    } catch (e) {
        console.log(e);
    }

    return data?.school == null ? { notFound: true, props: { school: null, currentSchoolScopes: null } } : { props: data };
};
