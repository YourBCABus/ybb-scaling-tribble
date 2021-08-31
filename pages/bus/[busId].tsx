import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetBus, GetBus_bus_stops } from "./__generated__/GetBus";
import { GetPerms } from "./__generated__/GetPerms";

import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { Props } from "../../lib/utils";
import { MouseEvent } from "react";
import { DroppableProvided, DraggableProvided, resetServerContext } from "react-beautiful-dnd";

import styles from "../../styles/Bus.module.scss";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

import Head from 'next/head';
import Link from "next/link";
import BusComponent, { BusComponentSizes } from "../../lib/busComponent";
import NavBar, { PagesInNavbar } from "../../lib/navbar";
import NoSSRComponent from "../../lib/noSSRComponent";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

import permParseFunc from "../../lib/perms";
import { saveBoardingAreaCallback, saveBusCallback, saveStopOrderCallback } from "../../lib/editingCallbacks";
import ConnectionMonitor from "../../lib/serverSidePropsMonitorComponent";
import { NextSeo } from "next-seo";

export const GET_BUS = gql`
query GetBus($id: ID!) {
    bus(id: $id) {
        available
        boardingArea
        company
        id
        invalidateTime
        name
        otherNames
        phone
        schoolID
        stops {
            id
            name
            description
            location {
                lat
                long
            }
            order
        }
        school {
            name
        }
    }
}
`;
export const GET_PERMS = gql`
query GetPerms($schoolID: ID!) {
    currentSchoolScopes(schoolID: $schoolID) 
}
`;
function reorder<T>(list: readonly T[], startIndex: number, endIndex: number): T[] {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
  
    return result;
};

export default function Bus({ bus: busOrUndef, currentSchoolScopes: permsOrUndef }: Props<typeof getServerSideProps>): JSX.Element {
    const bus = Object.freeze(busOrUndef!);
    const perms = Object.freeze(permParseFunc(Object.freeze(permsOrUndef!)));

    const [stops, setStops] = useState(Object.freeze(returnSortedStops(bus.stops)));
    useEffect(() => {
        setStops(Object.freeze(returnSortedStops(bus.stops)));
    }, [bus.stops]);

    let [editMode, setEditMode] = useState<boolean>(false);
    let [editFreeze, setEditFreeze] = useState<boolean>(false);

    let [starredBusIDs, setStarredBusIDs] = useState<Set<string>>(new Set());
    useEffect(() => {
        setStarredBusIDs(new Set(JSON.parse(localStorage.getItem("starred")!) as string[]));
    }, []);
    useEffect(() => {
        localStorage.setItem("starred", JSON.stringify([...starredBusIDs]));
    }, [starredBusIDs]);

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

    return <div>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <NextSeo title={bus.name ?? "Bus"} />
        <header className={styles.header}>
            <NavBar
                selectedPage={PagesInNavbar.NONE}
                editSwitchOptions={
                    perms.bus.update
                    || perms.bus.updateStatus 
                    || perms.bus.delete
                    || perms.stop.create
                    || perms.stop.update
                    || perms.stop.delete
                        ? {state: editMode, onChange: setEditMode}
                        : undefined
                }
            />
            <Link href={`/school/${bus.schoolID}`}>
                <a className={styles.back_button}>
                    <FontAwesomeIcon icon={faChevronLeft} className={styles.back_button_icon} />
                    <span className={styles.back_button_text}>{bus.school.name}</span>
                </a>
            </Link>
        </header>
        <BusComponent
            bus={bus}
            starCallback={(event) => starCallback(bus.id, event)}
            isStarred={starredBusIDs.has(bus.id)}
            editing={editMode && perms}
            editFreeze={editFreeze}
            size={BusComponentSizes.LARGE}
            noLink={true}
            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction)(bus.id)}
            saveBusNameCallback={
                (name) => saveBusCallback(updateServerSidePropsFunction)(bus.id)(
                    {
                        name,
                        company: bus.company,
                        phone: bus.phone,
                        available: bus.available,
                        otherNames: bus.otherNames,
                    }
                )
            }
        />
        <NoSSRComponent>
            <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                if (result.destination.index === result.source.index) return;
                let newStopOrder = reorder(stops, result.source.index, result.destination.index);
                setStops(newStopOrder);
                saveStopOrderCallback(updateServerSidePropsFunction)(bus.id)(newStopOrder);
            }}>
                <Droppable droppableId="stops">
                    
                    {(provided: DroppableProvided) => (
                        <div className={styles.stops}>
                            <h1> </h1>
                            <ul {...provided.droppableProps} ref={provided.innerRef} >
                                {
                                    stops.map(
                                        (stop, index) => <Draggable isDragDisabled={!editMode || editFreeze} key={stop.id} draggableId={stop.id} index={index}>
                                            {
                                                (provided: DraggableProvided) => (
                                                    <li ref={provided.innerRef} {...provided.draggableProps}>
                                                        <div>
                                                            <h1>{stop.name}</h1>
                                                            <p>{stop.description}</p>
                                                        </div>
                                                        {editMode && <span {...provided.dragHandleProps} className={styles.stop_drag_handle}><FontAwesomeIcon icon={faBars} size="lg"/></span>}
                                                    </li>
                                                )
                                            }
                                        </Draggable>
                                    )
                                }
                                {provided.placeholder}
                            </ul>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </NoSSRComponent>
        <ConnectionMonitor editing={editMode} setEditFreeze={setEditFreeze}/>
    </div>;
}

function returnSortedStops(stops: GetBus_bus_stops[]): GetBus_bus_stops[] {
    return [...stops].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {
    const client = createNewClient();

    let data: GetBus | null = null;
    let currentSchoolScopes: string[] | null = null;
    try {
        const { data: scopedData } = await client.query<GetBus>({query: GET_BUS, variables: {id: context.params!.busId}, context: {req: context.req}});
        data = scopedData;

        const {data: { currentSchoolScopes: scopedCurrentSchoolScopes }} = await client.query<GetPerms>({query: GET_PERMS, variables: {schoolID: data.bus?.schoolID}, context: {req: context.req}});
        currentSchoolScopes = scopedCurrentSchoolScopes;
    } catch (e) {
        console.log(e);
    }

    return !data?.bus || !currentSchoolScopes ? {notFound: true, props: {}} : {props: {bus: data.bus, currentSchoolScopes}};
};
