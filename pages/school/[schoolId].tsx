import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchoolAndPerms, GetSchoolAndPerms_school_buses } from "./__generated__/GetSchoolAndPerms";
import { ApolloError } from "@apollo/client";

import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from "node:querystring";

import Head from 'next/head';
import NavBar, { PagesInNavbar } from "../../lib/navbar";
import Bus from "../../lib/busComponent";

import styles from "../../styles/School.module.scss";

import { useState, useEffect, MouseEvent, ChangeEvent } from "react";

import permParseFunc from "../../lib/perms";

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
    starredBusIDs: Set<string>;
    isStarredList: boolean;
    currEdit: {id: string, content: string};
    editing: boolean;
    starCallback: (id: string, event: MouseEvent<SVGSVGElement>) => void;
    onEditCallback: (id: string, event: ChangeEvent<HTMLInputElement>) => void;
    saveCallback: (id: string, boardingArea: string | null) => Promise<void>;
}

function BusList( { buses, starredBusIDs, isStarredList, currEdit, editing, starCallback, onEditCallback, saveCallback }: BusListProps ): JSX.Element {
    return <div className={styles.bus_container_container + (isStarredList ? ` ${styles.bus_container_starred_container}` : ``)}>
        <div className={styles.bus_container}>
            {buses.map(
                bus => 
                    <Bus
                        bus={
                            bus.id === currEdit.id
                                ? {
                                    __typename: "Bus",
                                    name: bus.name,
                                    available: bus.available,
                                    id: bus.id,
                                    invalidateTime: new Date(new Date().getTime() + 10000),
                                    boardingArea: currEdit.content}
                                : bus
                        }
                        starCallback={(event) => starCallback(bus.id, event)}
                        isStarred={starredBusIDs.has(bus.id)}
                        key={bus.id}
                        editing={editing}
                        onEdit={(event) => onEditCallback(bus.id, event)}
                        saveCallback={() => saveCallback(bus.id, bus.id === currEdit.id ? currEdit.content : bus.boardingArea)}
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

    const router = useRouter();
    useEffect(() => {
        const interval = setInterval(() => {
            router.replace(router.asPath, undefined, {scroll: false});
        }, editMode ? 2000 : 15000);
        return () => clearInterval(interval);
    }, [router, editMode]);


    let [currEdit, setCurrEdit] = useState<{id: string, content: string}>({id: "", content: ""});


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
    const onEditCallback = (id: string, event: ChangeEvent<HTMLInputElement>): void => setCurrEdit({id, content: event.target.value});
    const saveCallback = async (id: string, boardingArea: string | null): Promise<void> => {
        if (boardingArea == null) {
            boardingArea = "?";
        }
        await fetch(`/api/updateBusStatus?id=${encodeURIComponent(id)}&boardingArea=${encodeURIComponent(boardingArea)}`);
        router.replace(router.asPath, undefined, {scroll: false});
        setCurrEdit({id: "", content: ""});
    };


    const starredBuses = Object.freeze(buses.filter(bus => starredBusIDs.has(bus.id)));

    return (
        <div>
            <Head>
                <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
            </Head>
            <header className={styles.header}>
                <NavBar selectedPage={PagesInNavbar.HOME} editSwitchOptions={perms.bus.create || perms.bus.updateStatus ? {state: editMode, onChange: setEditMode} : undefined}/>
                <h1 className={styles.school_name}>{school.name}</h1>
                <br/>
            </header>
            {
                starredBuses.length > 0 && <BusList
                    buses={starredBuses}
                    starredBusIDs={starredBusIDs}
                    isStarredList={true}
                    currEdit={currEdit}
                    editing={editMode && perms.bus.updateStatus}
                    starCallback={starCallback}
                    onEditCallback={onEditCallback}
                    saveCallback={saveCallback}
                />
            }
            
            <BusList
                buses={buses}
                starredBusIDs={starredBusIDs}
                isStarredList={false}
                currEdit={currEdit}
                editing={editMode && perms.bus.updateStatus}
                starCallback={starCallback}
                onEditCallback={onEditCallback}
                saveCallback={saveCallback}
            />
        </div>
    );
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
