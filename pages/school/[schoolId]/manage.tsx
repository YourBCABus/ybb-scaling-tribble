import createNewClient from "../../../lib/utils/librarystuff/apollo-client";
import { GET_SCHOOL_AND_PERMS } from ".";
import { GetSchoolAndPerms } from "../../../__generated__/GetSchoolAndPerms";

import { Props } from "lib/utils/general/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";

import Head from 'next/head';
import { NextSeo } from "next-seo";

// export const GET_SCHOOL_AND_PERMS = gql`
// query GetSchoolAndPerms($id: ID!) {
//     school(id: $id) {
//         id
//         name
//         location {
//             lat
//             long
//         }
//         buses {
//             id
//             name
//             boardingArea
//             invalidateTime
//             available
//         }
//         mappingData {
//             boardingAreas {
//                 name
//             }
//         }
//     }
//     currentSchoolScopes(schoolID: $id) 
// }
// `;

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
        const params = context.params;
        if (params === undefined) throw new Error("Null context params!");
        const { data: scopedData } = await client.query<GetSchoolAndPerms>({query: GET_SCHOOL_AND_PERMS, variables: {id: params.schoolId}, context: {req: context.req}});
        data = scopedData;
    } catch (e) {
        console.log(e);
    }

    return data?.school == null ? { notFound: true, props: { school: null, currentSchoolScopes: null } } : { props: data };
};
