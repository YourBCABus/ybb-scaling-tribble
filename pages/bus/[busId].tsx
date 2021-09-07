import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetBus, GetBus_bus_stops } from "../../__generated__/GetBus";
import { GetPerms } from "../../__generated__/GetPerms";

import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { MouseEvent } from "react";
import { DroppableProvided, DraggableProvided, resetServerContext } from "react-beautiful-dnd";

import styles from "../../styles/Bus.module.scss";

import { useState, useEffect, useCallback, useContext } from "react";
import Router, { useRouter } from 'next/router';

import MutationQueueContext from "../../lib/mutationQueue";

import Head from 'next/head';
import Link from "next/link";
import BusComponent, { BusComponentSizes } from "../../lib/busComponent";
import NavBar, { PagesInNavbar } from "../../lib/navbar";
import NoSSRComponent from "../../lib/noSSRComponent";
import { NextSeo } from "next-seo";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import ReactModal from "react-modal";

import permParseFunc from "../../lib/perms";
import { deleteBusCallback, saveBoardingAreaCallback, saveBusCallback, saveStopOrderCallback } from "../../lib/editingCallbacks";
import ConnectionMonitor, { HandleConnQualContext } from "../../lib/connectionMonitorComponent";
import { migrateOldStarredBuses, Props } from "../../lib/utils";
import { EditModeProps } from "../_app";

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

type BusProps = Props<typeof getServerSideProps> & EditModeProps;

export default function Bus({ bus: busOrUndef, currentSchoolScopes: permsOrUndef, editMode, setEditMode, editFreeze }: BusProps): JSX.Element {
    const bus = Object.freeze(busOrUndef!);
    const perms = Object.freeze(permParseFunc(Object.freeze(permsOrUndef!)));
    const stops = Object.freeze(returnSortedStops(bus.stops));

    const [currStopsEdit, setCurrStopsEdit] = useState<null | GetBus_bus_stops[]>(null);

    let [starredBusIDs, setStarredBusIDs] = useState<Set<string>>(new Set());
    useEffect(() => {
        setStarredBusIDs(new Set((JSON.parse(localStorage.getItem("starred") ?? "[]") as string[]).concat(migrateOldStarredBuses())));
    }, []);
    useEffect(() => {
        localStorage.setItem("starred", JSON.stringify([...starredBusIDs]));
    }, [starredBusIDs]);

    const router = useRouter();
    const updateServerSidePropsFunction = useCallback(() => {
        const currRouter = Router;
        return currRouter.replace(currRouter.asPath, undefined, {scroll: false});
    }, []);
    useEffect(() => {
        const interval = setInterval(updateServerSidePropsFunction, editMode ? 5000 : 15000);
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
  
    const [isDeletingBus, setDeletingBus] = useState<boolean>(false);

    const currentMutationQueue = useContext(MutationQueueContext);
    const { handleConnQual } = useContext(HandleConnQualContext);

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
            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)(bus.id)}
            saveBusNameCallback={
                (name) => saveBusCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)(bus.id)(
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
                let newStopOrder = reorder(currStopsEdit || stops, result.source.index, result.destination.index);
                setCurrStopsEdit(newStopOrder);
                saveStopOrderCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)(bus.id)(newStopOrder).then(() => setCurrStopsEdit(null));
            }}>
                <Droppable droppableId="stops">
                    
                    {(provided: DroppableProvided) => (
                        <div className={styles.stops}>
                            <h1> </h1>
                            <ul {...provided.droppableProps} ref={provided.innerRef} >
                                {
                                    (currStopsEdit || stops).map(
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
        <div className={styles.actions}>
            {(editMode && perms.bus.delete) && <button className={styles.delete_bus} onClick={() => setDeletingBus(true)}><FontAwesomeIcon icon={faTrash} /> Delete Bus</button>}
        </div>
        <ReactModal isOpen={isDeletingBus} style={{content: {
            maxWidth: "400px",
            height: "140px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        }}}>
            <h3 className={styles.delete_bus_modal_title}>Are you sure you want to delete {bus.name ? `"${bus.name}"` : "this bus"}?</h3>
            <button className={styles.delete_bus_modal_cancel} onClick={() => setDeletingBus(false)}>Cancel</button>
            <button className={styles.delete_bus_modal_confirm} onClick={() => {
                deleteBusCallback(router, bus.id, bus.schoolID);
            }}>Delete</button>
        </ReactModal>
        <ConnectionMonitor editing={editMode}/>
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
