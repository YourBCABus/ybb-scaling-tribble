import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchool, GetSchool_school_buses } from "./__generated__/GetSchool";
import { ApolloError } from "@apollo/client";

import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from "node:querystring";

import Head from 'next/head';
import NavBar, { PagesInNavbar } from "../../lib/navbar";

import styles from "../../styles/School.module.scss";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, MouseEventHandler, ChangeEventHandler, MouseEvent, ChangeEvent } from "react";

import getBoardingArea from "../../lib/boardingAreas";
import Link from "next/link";
import { GetPerms } from "./__generated__/GetPerms";
import permParseFunc from "../../lib/perms";

export const GET_SCHOOL = gql`
query GetSchool($id: ID!) {
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
}
`;

export const GET_PERMS = gql`
query GetPerms($id: ID!) {
    currentSchoolScopes(schoolID: $id) 
}
`;

interface BusProps {
    bus: GetSchool_school_buses,
    starCallback: MouseEventHandler<SVGSVGElement>,
    isStarred: boolean, 
    editing: boolean,
    onEdit: ChangeEventHandler<HTMLInputElement>,
    saveCallback: () => void
}


function Bus({ bus: { name, id, available, boardingArea, invalidateTime }, starCallback, isStarred, editing, onEdit, saveCallback }:  BusProps): JSX.Element {
    const inner = <div className={styles.bus_view}>
        <div className={styles.bus_name_and_status}>
            <span className={styles.bus_name}>{name}</span>
            <br/>
            <span className={styles.bus_status}>{available ? (getBoardingArea(boardingArea, invalidateTime) === "?" ? "Not on location" : "On location") : "Not running"}</span>
        </div>
        <FontAwesomeIcon icon={faStar} className={styles.bus_star_indicator} style={{color: isStarred ? "#00b0ff" : "rgba(0,0,0,.2)"}} onClick={starCallback} size={"lg"}/>
        <div className={styles.bus_boarding_area_background_div} style={getBoardingArea(boardingArea, invalidateTime) === "?" ? {} : {color: "#e8edec", backgroundColor: "#00796b"}}>
            {
                editing
                    ? <input
                        className={styles.bus_boarding_area_input}
                        onChange={onEdit}
                        onBlur={saveCallback}
                        value={getBoardingArea(boardingArea, invalidateTime)}
                        onClick={
                            (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                event.currentTarget.focus();
                            }
                        }
                        onKeyDown={
                            (event) => {
                                console.log(event.key);
                                if (event.key === "Enter") event.currentTarget.blur();
                            }
                        }
                    />
                    : getBoardingArea(boardingArea, invalidateTime)
            }
        </div>
        
    </div>;
    
    return editing ? inner : <Link href={`/bus/${id}`} passHref={true}>{inner}</Link>;
}

export default function School({ school: schoolOrUndef, perms: permsOrUndef }: Props<typeof getServerSideProps>): JSX.Element {
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
        await fetch(`/api/updateBusStatus?id=${id}&boardingArea=${boardingArea}`);
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
                starredBuses.length > 0 && <div className={`${styles.bus_container_container} ${styles.bus_container_starred_container}`}>
                    <div className={styles.bus_container}>
                        {starredBuses.map(
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
                                    editing={editMode && perms.bus.updateStatus}
                                    onEdit={(event) => onEditCallback(bus.id, event)}
                                    saveCallback={() => saveCallback(bus.id, bus.id === currEdit.id ? currEdit.content : bus.boardingArea)}
                                />
                        )}
                    </div>
                </div>
            }
            
            <div className={styles.bus_container_container}>
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
                                editing={editMode && perms.bus.updateStatus}
                                onEdit={(event) => onEditCallback(bus.id, event)}
                                saveCallback={() => saveCallback(bus.id, bus.id === currEdit.id ? currEdit.content : bus.boardingArea)}
                            />
                    )}
                </div>
            </div>
        </div>
    );
}


function returnSortedBuses(buses: GetSchool_school_buses[]): GetSchool_school_buses[] {
    let availableBuses:   GetSchool_school_buses[] = buses.filter((bus) =>  bus.available);
    availableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    let unavailableBuses: GetSchool_school_buses[] = buses.filter((bus) => !bus.available);
    unavailableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    return [...availableBuses, ...unavailableBuses];
}

export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {
    const client = createNewClient();
    
    let data: GetSchool | null = null;
    try {
        const { data: scopedData } = await client.query<GetSchool>({query: GET_SCHOOL, variables: {id: context.params!.schoolId}});
        data = scopedData;
    } catch (e) {
        console.log(e);
        if (e instanceof ApolloError) {
            e.clientErrors.map((error) => console.log(error.name));
        } else throw e;
    }


    const { data: permData } = await client.query<GetPerms>({query: GET_PERMS, variables: {id: context.params!.schoolId}, context: {req: context.req}});

    return data?.school == null ? {notFound: true, props: {}} : {props: {school: data.school, perms: permData.currentSchoolScopes }};
};
