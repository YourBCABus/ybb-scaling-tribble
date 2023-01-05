import gql from "graphql-tag";
import createNewClient from "lib/utils/librarystuff/apollo-client";
import { GetBus, GetBus_bus } from "__generated__/GetBus";
import { GetPerms } from "__generated__/GetPerms";

import { GetServerSideProps } from "next";
import { FC, useMemo } from "react";

import styles from "@page-styles/Bus.module.scss";

import { useContext, useState } from "react";

import MutationQueueContext, { MutationType, updateServerSidePropsFunction } from '@utils/editing/mutation-queue';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import BusComponent, { BusComponentSizes } from 'lib/components/buses/Bus';
import NavBar, { PagesInNavbar } from 'lib/components/other/navbar';
import { NextSeo } from 'next-seo';
import Head from 'next/head';
import Link from 'next/link';

import { PermStructure } from 'lib/utils/general/perms';

import { PageGlobalProps } from 'pages/_app';

import { useInterval, usePerms, useStars } from "@utils/hooks";
import { BoardingArea, BusData, SchoolId } from "@utils/proptypes";
import useStops, { BusStop } from "@utils/hooks/meta/useStops";
import PhoneNum from "@components/phone";

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

interface BusProps {
    bus: GetBus_bus,
    perms: string[];
}

const canEdit = ({ bus, stop }: PermStructure<boolean>) => bus.update || bus.updateStatus || bus.delete || stop.create || stop.update || stop.delete || undefined;

const Bus: FC<BusProps & PageGlobalProps> = (props) => {
    const s_perms = usePerms(props.perms);

    const b_data = useMemo(() => BusData.fromBus(props.bus), [props.bus]);

    const b_stops = useStops(props.bus.stops);

    const {
        g_eMode, g_eModeSet,
        g_eFreeze,
    } = props;

    const b_editing = g_eMode && canEdit(s_perms);

    const s_id = useMemo(() => new SchoolId(props.bus.schoolID), [props.bus.schoolID]);
    const s_name = props.bus.school.name ?? "School";

    useInterval(b_editing ? 5000 : 15000, updateServerSidePropsFunction);


    const [starred, starCallback] = useStars();
    
    const mutQueue = useContext(MutationQueueContext);

    const [currStopsEdit, setCurrStopsEdit] = useState<null | BusStop[]>(null);

    const [saveBoardingArea, saveBusName, updatePhoneNumbers] = useMemo(
        () => [
            (boardingArea: BoardingArea) => mutQueue.enqueue({
                __type: MutationType.UP_B_BOARD,
                b_id: b_data.id,
                s_id,
                b_area: boardingArea,
            }).then(updateServerSidePropsFunction),
            (name: string) => mutQueue.enqueue({
                __type: MutationType.UP_B_NAME,
                b_id: b_data.id,
                s_id,
                b_curr: b_data,
                b_name: name,
            }).then(updateServerSidePropsFunction),
            (numbers: string[]) => mutQueue.enqueue({
                __type: MutationType.UP_B_PHONES,
                b_id: b_data.id,
                s_id,
                b_curr: b_data,
                b_phones: numbers,
            }).then(updateServerSidePropsFunction),
        ] as const,
        [mutQueue, s_id, b_data],
    );

    return <div>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <NextSeo title={b_data.name || "Bus"} />
        <header className={styles.header}>
            <NavBar
                selectedPage={PagesInNavbar.NONE}
                editSwitchOptions={canEdit(s_perms) && {state: g_eMode, onChange: g_eModeSet}}
            />
            <Link href={`/school/${s_id.toString()}`}>
                <a className={styles.back_button}>
                    <FontAwesomeIcon icon={faChevronLeft} className={styles.back_button_icon} />
                    <span className={styles.back_button_text}>{s_name}</span>
                </a>
            </Link>
        </header>

        <BusComponent
            bus={b_data}
            starCallback={(event) => starCallback(b_data.id, event.nativeEvent)}
            isStarred={starred.has(b_data.id.toString())}
            editing={g_eMode ? s_perms : undefined}
            editFreeze={g_eFreeze}
            size={BusComponentSizes.LARGE}
            noLink={true}
            saveBoardingAreaCallback={saveBoardingArea}
            saveBusNameCallback={saveBusName}
        />
        <div className={styles.side_by_side}>
            <PhoneNum phoneStrs={b_data.phones} editing={b_editing || false} updatePhoneNumbers={newVals => updatePhoneNumbers(newVals).then(() => console.log("hi"))}/>
            {/* <NoSSRComponent>
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
            </NoSSRComponent> */}
            {/* <div>
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
            </div> */}
        </div>

        {/* <div className={styles.actions}>    
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
        <ConnectionMonitor editing={editMode}/> */}
    </div>;
};

export const getServerSideProps: GetServerSideProps<BusProps> = async(context) => {
    const client = createNewClient();

    try {
        const params = context.params;
        if (params === undefined) throw new Error("Null context params!");

        const { data: { bus } } = await client.query<GetBus>({
            query: GET_BUS,
            variables: {id: params.busId},
            context: {req: context.req},
        });

        if (!bus) return {notFound: true, props: {}};

        const { data: { currentSchoolScopes } } = await client.query<GetPerms>({
            query: GET_PERMS,
            variables: {schoolID: bus?.schoolID},
            context: {req: context.req},
        });

        return { props: { bus, perms: currentSchoolScopes } };
    } catch (e) {
        console.error(e);
        return {notFound: true, props: {}};
    }

};

export default Bus;
