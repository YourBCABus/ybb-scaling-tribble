import client from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchool, GetSchool_school_buses } from "./__generated__/GetSchool";
import { ApolloError } from "@apollo/client";

import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, MouseEventHandler } from "react";

export const GET_SCHOOL = gql`
query GetSchool($id: ID!) {
    school(id: $id) {
        id
        name
        location {
            lat
            long
        }
        available
        buses {
            id
            name
            boardingArea
            invalidateTime
            available
        }
    }
}
`;

function Bus({ bus: { name, id }, starCallback, isStarred }: { bus: GetSchool_school_buses, starCallback: MouseEventHandler<SVGSVGElement>, isStarred: boolean } ): JSX.Element {
    return <div>
        <span className="bus-name">{name}</span>
        <div className="bus-boarding-area-background-div">?</div>
        <FontAwesomeIcon icon={faStar} className="bus-star-indicator" style={{color: isStarred ? "blue" : "gray"}} onClick={starCallback} size="2x"/>
    </div>;
}

export default function School({ school: schoolOrUndef }: Props<typeof getServerSideProps>) {
    let school = schoolOrUndef!;
    let [starredBusses, setStarredBusses] = useState<Set<string>>(new Set());
    useEffect(() => {
        setStarredBusses(new Set(JSON.parse(localStorage.getItem("starred")!) as string[]));
    }, []);
    useEffect(() => {
        localStorage.setItem("starred", JSON.stringify([...starredBusses]));
    }, [starredBusses]);

    return (
        <div>
            <h1>{school.name}</h1>
            {school.location === null ? <p>Unknown location.</p> : <p>Latitude: {school.location?.lat}, Longitude: {school.location?.long}</p>}
            <p>Internal School ID: {school.id}</p>
            <p>School is {school.available ? "" : "not "}available.</p>
            {
                school
                    .buses
                    .map((a) => a)
                    .sort((a, b) => (a.available ? 1 : 0) - (b.available ? 1 : 0))
                    .map(
                        bus => 
                            <Bus bus={bus} starCallback={
                                () => {
                                    const starred = new Set(starredBusses);
                                    if (starred.has(bus.id)) {
                                        starred.delete(bus.id);
                                    } else {
                                        starred.add(bus.id);
                                    }
                                    setStarredBusses(starred);
                                }
                            } isStarred={starredBusses.has(bus.id)} key={bus.id} />
                    )
            }
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
