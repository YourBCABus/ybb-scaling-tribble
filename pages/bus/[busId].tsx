import gql from "graphql-tag";
import createNewClient from "lib/utils/librarystuff/apollo-client";
import { GetBus, GetBus_bus_stops } from "__generated__/GetBus";
import { GetPerms } from "__generated__/GetPerms";

import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { MouseEvent } from "react";
import { DraggableProvided, DroppableProvided } from "react-beautiful-dnd";

import styles from "styles/Bus.module.scss";

import Router, { useRouter } from 'next/router';
import { useCallback, useContext, useEffect, useState } from "react";

import MutationQueueContext from 'lib/utils/general/mutationQueue';

import { faAngleUp, faBars, faChevronLeft, faPowerOff, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BusComponent, { BusComponentSizes } from 'lib/components/buses/Bus';
import NavBar, { PagesInNavbar } from 'lib/components/other/navbar';
import NoSSRComponent from 'lib/components/other/noSSRComponent';
import { NextSeo } from 'next-seo';
import Head from 'next/head';
import Link from 'next/link';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import ReactModal from 'react-modal';

import ConnectionMonitor, { HandleConnQualContext } from 'lib/components/other/connectionMonitorComponent';
import formatPhoneNumberString, { directlyMatchesPhoneNumber, formatSinglePhoneNumber } from 'lib/components/other/phoneNumberParser';
import { deleteBusCallback, saveBoardingAreaCallback, saveBusCallback, saveStopOrderCallback } from 'lib/utils/general/editingCallbacks';
import permParseFunc from 'lib/utils/general/perms';
import { Props, migrateOldStarredBuses, ifOrUndef } from 'lib/utils/general/utils';
import { EditModeProps } from 'pages/_app';
import Collapsible from 'react-collapsible';

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
}

type BusProps = Props<typeof getServerSideProps> & EditModeProps;

export default function Bus({ bus: busMut, currentSchoolScopes: permsMut, editMode, setEditMode, editFreeze }: BusProps): JSX.Element {
    if (!busMut || !permsMut) throw new Error("School and/or scopes are not defined");


    const bus = Object.freeze(busMut);

    const perms = Object.freeze(permParseFunc(Object.freeze(permsMut)));
    const stops = Object.freeze(returnSortedStops(bus.stops));

    const [currStopsEdit, setCurrStopsEdit] = useState<null | GetBus_bus_stops[]>(null);

    const [addPhoneNumberEdit, setAddPhoneNumberEdit] = useState<null | string>(null);
    const [phoneNumberError, setPhoneNumberError] = useState(false);

    const [starredBusIDs, setStarredBusIDs] = useState<Set<string>>(new Set());
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
  
    const [deletingPhoneNumber, setDeletingPhoneNumber] = useState<{
        deletingSingleNum: true, index: number, subIndex: number
    } | {
        deletingSingleNum: false, index: number
    } | null>(null);
    
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
            editing={ifOrUndef(editMode, perms)}
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
        <div className={styles.side_by_side}>
            <NoSSRComponent>
                <DragDropContext onDragEnd={(result) => {
                    if (!result.destination) return;
                    if (result.destination.index === result.source.index) return;
                    const newStopOrder = reorder(currStopsEdit || stops, result.source.index, result.destination.index);
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
            <div>
                <h3 className={styles.phone_num_header}>Phone Numbers</h3>
                <ul className={`${styles.phone_num_list}`}>
                    {
                        bus.phone
                            .flatMap<[string, number,  number]>(
                                (rawPhoneNumString, index) => formatPhoneNumberString(
                                    rawPhoneNumString
                                ).map<[string, number, number]>(
                                    (numberAndSubInd) => [...numberAndSubInd, index]
                                )
                            )
                            .map(
                                ([formattedPhoneNum, subInd, index]) => <li key={`${index}, ${subInd}`}><div className={editMode ? styles.with_trash_can : ""}>
                                    <p>
                                        Call {editMode ? formattedPhoneNum.replace(";", " #") : <a href={`tel:${formattedPhoneNum}`}>{formattedPhoneNum.replace(";", " #")}</a>}.
                                    </p>
                                    {editMode && <FontAwesomeIcon icon={faTrash} onClick={
                                        () => setDeletingPhoneNumber({
                                            deletingSingleNum: true,
                                            index,
                                            subIndex: subInd,
                                        })
                                    }/>}
                                </div></li>
                            )
                    }
                </ul>
                {
                    editMode && <input
                        placeholder="New Phone Number..."
                        className={`${styles.phone_num_input}`} 
                        onChange={(event) => setAddPhoneNumberEdit(event.currentTarget.value)}
                        readOnly={editFreeze}
                        onBlur={() => { 
                            if (addPhoneNumberEdit === null) return;
                            const formatted = formatSinglePhoneNumber(addPhoneNumberEdit.trim());
                            if (formatted === null) {
                                setPhoneNumberError(true);
                                return;
                            }
                            setPhoneNumberError(false);
                            saveBusCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)(bus.id)(
                                {
                                    name: bus.name,
                                    company: bus.company,
                                    phone: [...bus.phone, formatted],
                                    available: bus.available,
                                    otherNames: bus.otherNames,
                                }
                            ).then(() => setAddPhoneNumberEdit(null));
                        }}
                        value={addPhoneNumberEdit ?? ""}
                        onKeyDown={ (event) => event.key === "Enter" && event.currentTarget.blur() }
                    />
                }
                {
                    editMode && phoneNumberError && <p className={styles.phone_number_error}>Invalid Phone number!</p>
                }
                
                {
                    (editMode && bus.phone.length !== 0) && <Collapsible className={`${styles.extra_phone_numbers_closed} ${styles.extra_phone_numbers_always}`} openedClassName={styles.extra_phone_numbers_always} trigger={<div>Click for raw phone numbers... <FontAwesomeIcon icon={faAngleUp}/></div>} transitionTime={100}>
                        {
                            bus.phone.map(
                                (phone_string, index) => <div className={styles.with_trash_can} key={index}>
                                    <p>{phone_string}</p>{editMode && <FontAwesomeIcon icon={faTrash} onClick={() => setDeletingPhoneNumber({
                                        deletingSingleNum: false,
                                        index,
                                    })}/>}
                                </div>
                            )
                        }
                    </Collapsible>
                }
            </div>
        </div>

        <div className={styles.actions}>    
            {
                (editMode && perms.bus.delete) && <button
                    className={`${styles.available_bus} ${bus.available ? styles.destructive_action : styles.green_action}`}
                    onClick={
                        () => saveBusCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)(bus.id)(
                            {
                                name: bus.name,
                                company: bus.company,
                                phone: bus.phone,
                                available: !bus.available,
                                otherNames: bus.otherNames,
                            }
                        )
                    }
                >
                    <FontAwesomeIcon icon={faPowerOff} /> {bus.available ? "De-activate Bus" : "Activate Bus"}
                </button>
            }
            <br/><br/>
            {(editMode && perms.bus.delete) && <button className={`${styles.delete_bus} ${styles.destructive_action}`} onClick={() => setDeletingBus(true)}><FontAwesomeIcon icon={faTrash} /> Delete Bus</button>}
        </div>
        <ReactModal isOpen={!!deletingPhoneNumber} style={{content: {
            maxWidth: "400px",
            height: "140px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        }}}>
            <h3 className={styles.modal_title}>
                Are you sure you want to delete this {deletingPhoneNumber?.deletingSingleNum
                    ? <span>number?<br/><code>{formatPhoneNumberString(bus.phone[deletingPhoneNumber.index ?? 0]).slice(deletingPhoneNumber.subIndex)[0]}</code></span>
                    : <span>entry?: <br/><code>{bus.phone[deletingPhoneNumber?.index ?? 0]}</code></span>}</h3>
            <button className={styles.modal_cancel} onClick={() => setDeletingPhoneNumber(null)}>Cancel</button>
            <button className={styles.modal_confirm} onClick={
                deletingPhoneNumber?.deletingSingleNum ? () => {
                    saveBusCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)(bus.id)(
                        {
                            name: bus.name,
                            company: bus.company,
                            phone: removeIndPlusSubInd(bus.phone, deletingPhoneNumber.index, deletingPhoneNumber.subIndex),
                            available: bus.available,
                            otherNames: bus.otherNames,
                        }
                    );
                    setDeletingPhoneNumber(null);
                } : () => {
                    saveBusCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)(bus.id)(
                        {
                            name: bus.name,
                            company: bus.company,
                            phone: deletingPhoneNumber ? removeInd(bus.phone, deletingPhoneNumber.index) : bus.phone,
                            available: bus.available,
                            otherNames: bus.otherNames,
                        }
                    );
                    setDeletingPhoneNumber(null);
                }
            }>Delete</button>
        </ReactModal>
        <ReactModal isOpen={isDeletingBus} style={{content: {
            width: "80%",
            maxWidth: "400px",
            height: "140px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        }}}>
            <h3 className={styles.modal_title}>Are you sure you want to delete {bus.name ? `"${bus.name}"` : "this bus"}?</h3>
            <button className={styles.modal_cancel} onClick={() => setDeletingBus(false)}>Cancel</button>
            <button className={styles.modal_confirm} onClick={() => {
                deleteBusCallback(router, bus.id, bus.schoolID);
            }}>Delete</button>
        </ReactModal>
        <ConnectionMonitor editing={editMode}/>
    </div>;
}

function removeInd(phones: string[], ind: number) {
    const outPhones = [...phones];

    outPhones.splice(
        ind,
        1,
    );

    return outPhones;
}
function removeIndPlusSubInd(phones: string[], ind: number, subInd: number) {
    const outPhones = [...phones];

    if (directlyMatchesPhoneNumber(outPhones[ind])) return removeInd(phones, ind);

    outPhones.splice(ind, 1, phones[ind].substring(0, subInd) + "❌" + phones[ind].substring(subInd));

    return outPhones;
}

function returnSortedStops(stops: GetBus_bus_stops[]): GetBus_bus_stops[] {
    return [...stops].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {
    const client = createNewClient();

    let data: GetBus | null = null;
    let currentSchoolScopes: string[] | null = null;
    try {
        const params = context.params;
        if (params === undefined) throw new Error("Null context params!");

        const { data: scopedData } = await client.query<GetBus>({query: GET_BUS, variables: {id: params.busId}, context: {req: context.req}});
        data = scopedData;

        const {data: { currentSchoolScopes: scopedCurrentSchoolScopes }} = await client.query<GetPerms>({query: GET_PERMS, variables: {schoolID: data.bus?.schoolID}, context: {req: context.req}});
        currentSchoolScopes = scopedCurrentSchoolScopes;
    } catch (e) {
        console.log(e);
    }

    return !data?.bus || !currentSchoolScopes ? {notFound: true, props: {}} : {props: {bus: data.bus, currentSchoolScopes}};
};
