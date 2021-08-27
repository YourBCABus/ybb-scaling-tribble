import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchoolAndPerms, GetSchoolAndPerms_school_buses } from "./__generated__/GetSchoolAndPerms";

import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { MouseEvent } from "react";

import Head from 'next/head';
import NavBar, { PagesInNavbar } from "../../lib/navbar";
import Bus from "../../lib/busComponent";
import ConnectionMonitor from "../../lib/serverSidePropsMonitorComponent";

import styles from "../../styles/School.module.scss";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/router';

import permParseFunc from "../../lib/perms";
import { saveBoardingAreaCallback } from "../../lib/editingCallbacks";

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
    }
    currentSchoolScopes(schoolID: $id) 
}
`;

interface BusListProps {
    buses: readonly GetSchoolAndPerms_school_buses[];
 
    editing: false | ReturnType<typeof permParseFunc>;
    editFreeze: boolean;

    isStarredList: boolean;
    starredBusIDs: Set<string>;
    starCallback: (id: string, event: MouseEvent<SVGSVGElement>) => void;

    saveBoardingAreaCallback: (id: string) => (boardingArea: string | null) => Promise<void>;
}

function BusList(
    {
        buses,
        editing,
        editFreeze,
        isStarredList,
        starredBusIDs,
        starCallback,
        saveBoardingAreaCallback,
    }: BusListProps
): JSX.Element {
    return <div className={styles.bus_container_container + (isStarredList ? ` ${styles.bus_container_starred_container}` : ``)}>
        <div className={styles.bus_container}>
            {buses.map(
                bus => 
                    <Bus
                        key={bus.id}
                                
                        bus={bus}
                        
                        editing={editing}
                        editFreeze={editFreeze}
                        
                        starCallback={(event) => starCallback(bus.id, event)}
                        isStarred={starredBusIDs.has(bus.id)}
                        
                        saveBoardingAreaCallback={saveBoardingAreaCallback(bus.id)}
                    />
            )}
        </div>
    </div>;
}

export default function School({ school: schoolOrUndef, currentSchoolScopes: permsOrUndef }: Props<typeof getServerSideProps>): JSX.Element {
    const school = Object.freeze(schoolOrUndef!);
    const perms = Object.freeze(permParseFunc(Object.freeze(permsOrUndef!)));
    const buses = Object.freeze(returnSortedBuses(school.buses));

    let [starredBusIDs, setStarredBusIDs] = useState<Set<string>>(new Set());
    useEffect(() => {
        setStarredBusIDs(new Set(JSON.parse(localStorage.getItem("starred")!) as string[]));
    }, []);
    useEffect(() => {
        localStorage.setItem("starred", JSON.stringify([...starredBusIDs]));
    }, [starredBusIDs]);


    let [editMode, setEditMode] = useState<boolean>(false);
    let [editFreeze, setEditFreeze] = useState<boolean>(false);

    const router = useRouter();
    const updateServerSidePropsFunction = useCallback(() => router.replace(router.asPath, undefined, {scroll: false}), [router]);
    useEffect(() => {
        const interval = setInterval(updateServerSidePropsFunction, editMode ? 2000 : 15000);
        return () => clearInterval(interval);
    }, [editMode, updateServerSidePropsFunction]);


    const starCallback = (id: string, event: MouseEvent<SVGSVGElement>): void => {
        event.stopPropagation();
        event.preventDefault();
        const starred = new Set(starredBusIDs);
        if (starred.has(id)) {
            starred.delete(id);
        } else {
            starred.add(id);
        }
        setStarredBusIDs(starred);
    };

    const starredBuses = Object.freeze(buses.filter(bus => starredBusIDs.has(bus.id)));

    return <div>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <header className={styles.header}>
            <NavBar selectedPage={PagesInNavbar.NONE} editSwitchOptions={perms.bus.create || perms.bus.updateStatus ? {state: editMode, onChange: setEditMode} : undefined}/>
            <h1 className={styles.school_name}>{school.name}</h1>
        </header>
        {
            starredBuses.length > 0 && <BusList
                buses={starredBuses}
                
                editing={editMode && perms}
                editFreeze={editFreeze}

                isStarredList={true}
                starredBusIDs={starredBusIDs}
                starCallback={starCallback}
                
                saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction)}
            />
        }
        
        <BusList
            buses={buses}
            
            editing={editMode && perms}
            editFreeze={editFreeze}

            isStarredList={false}
            starredBusIDs={starredBusIDs}
            starCallback={starCallback}

            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction)}
        />
        <ConnectionMonitor editing={editMode} setEditFreeze={setEditFreeze}/>
    </div>;
}


function returnSortedBuses(buses: GetSchoolAndPerms_school_buses[]): GetSchoolAndPerms_school_buses[] {
    let availableBuses:   GetSchoolAndPerms_school_buses[] = buses.filter((bus) =>  bus.available);
    availableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    let unavailableBuses: GetSchoolAndPerms_school_buses[] = buses.filter((bus) => !bus.available);
    unavailableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    return [...availableBuses, ...unavailableBuses];
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
