import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchoolAndPerms, GetSchoolAndPerms_school_buses } from "./__generated__/GetSchoolAndPerms";

import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { MouseEvent } from "react";

import Head from 'next/head';
import NavBar, { PagesInNavbar } from "../../lib/navbar";
import Bus, { BusComponentSizes } from "../../lib/busComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

import styles from "../../styles/School.module.scss";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/router';

import permParseFunc from "../../lib/perms";
import { saveBoardingAreaCallback } from "../../lib/editingCallbacks";
import getBoardingArea from "../../lib/boardingAreas";

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
    editing: false | ReturnType<typeof permParseFunc>;
    starCallback: (id: string, event: MouseEvent<SVGSVGElement>) => void;
    saveBoardingAreaCallback: (id: string) => (boardingArea: string | null) => Promise<void>;
}

function BusList( { buses, starredBusIDs, isStarredList, editing, starCallback, saveBoardingAreaCallback }: BusListProps ): JSX.Element {
    return <div className={styles.bus_container_container + (isStarredList ? ` ${styles.bus_container_starred_container}` : ``)}>
        <div className={editing ? `${styles.bus_container} ${styles.bus_container_compact}` : styles.bus_container}>
            {buses.map(
                bus => 
                    <Bus
                        bus={
                            bus
                        }
                        starCallback={(event) => starCallback(bus.id, event)}
                        isStarred={starredBusIDs.has(bus.id)}
                        key={bus.id}
                        editing={editing}
                        saveBoardingAreaCallback={saveBoardingAreaCallback(bus.id)}
                        size={editing ? BusComponentSizes.COMPACT : BusComponentSizes.NORMAL}
                    />
            )}
        </div>
    </div>;
}

export default function School({ school: schoolOrUndef, currentSchoolScopes: permsOrUndef }: Props<typeof getServerSideProps>): JSX.Element {
    const school = Object.freeze(schoolOrUndef!);
    const perms = Object.freeze(permParseFunc(Object.freeze(permsOrUndef!)));

    let [starredBusIDs, setStarredBusIDs] = useState<Set<string>>(new Set());
    useEffect(() => {
        setStarredBusIDs(new Set(JSON.parse(localStorage.getItem("starred")!) as string[]));
    }, []);
    useEffect(() => {
        localStorage.setItem("starred", JSON.stringify([...starredBusIDs]));
    }, [starredBusIDs]);


    let [editMode, setEditMode] = useState<boolean>(false);

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
    
    const editing = editMode && perms;
    const [searchTerm, setSearchTerm] = useState("");


    let setEditModePlusClearSearch = (editMode: boolean) => {
        setEditMode(editMode);
        setSearchTerm("");   
    };

    const buses = Object.freeze(filterBuses(returnSortedBuses(school.buses), searchTerm));
    const starredBuses = Object.freeze(buses.filter(bus => starredBusIDs.has(bus.id)));

    return <div>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <header className={styles.header}>
            <NavBar selectedPage={PagesInNavbar.NONE} editSwitchOptions={perms.bus.create || perms.bus.updateStatus ? {state: editMode, onChange: setEditModePlusClearSearch} : undefined}/>
            <h1 className={styles.school_name}>{school.name}</h1>
            <div className={styles.search_box}>
                <FontAwesomeIcon className={styles.search_icon} icon={faSearch}></FontAwesomeIcon>
                <input
                    className={styles.search_input}
                    type="search"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder="Search for a bus..."
                />
            </div>
        </header>
        {
            starredBuses.length > 0 && !editMode && <BusList
                buses={starredBuses}
                starredBusIDs={starredBusIDs}
                isStarredList={true}
                editing={editing}
                starCallback={starCallback}
                saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction)}
            />
        }
        
        <BusList
            buses={buses}
            starredBusIDs={starredBusIDs}
            isStarredList={false}
            editing={editing}
            starCallback={starCallback}
            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction)}
        />
    </div>;
}


function returnSortedBuses(buses: GetSchoolAndPerms_school_buses[]): GetSchoolAndPerms_school_buses[] {
    let availableBuses:   GetSchoolAndPerms_school_buses[] = buses.filter((bus) =>  bus.available);
    availableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    let unavailableBuses: GetSchoolAndPerms_school_buses[] = buses.filter((bus) => !bus.available);
    unavailableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    return [...availableBuses, ...unavailableBuses];
}

function filterBuses(buses: readonly GetSchoolAndPerms_school_buses[], searchTerm: string): readonly GetSchoolAndPerms_school_buses[] {
    const term = searchTerm.trim().toLowerCase();

    // Allow users to search by name, boarding area, or exact ID
    return term.length > 0 ? buses.filter(bus => {
        if (bus.name?.toLowerCase().includes(term)) return true;
        if (bus.invalidateTime) {
            if (getBoardingArea(bus.boardingArea, new Date(bus.invalidateTime)).toLowerCase().includes(term)) return true;
        } else if (bus.boardingArea) {
            if (bus.boardingArea.toLowerCase().includes(term)) return true;
        } else {
            if (term === "?") return true;
        }
        if (bus.id.toLowerCase() === term) return true;
        return false;
    }) : buses;
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
