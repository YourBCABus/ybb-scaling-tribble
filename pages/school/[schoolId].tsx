import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchoolAndPerms, GetSchoolAndPerms_school_buses } from "../../__generated__/GetSchoolAndPerms";

import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { MouseEvent } from "react";

import Head from 'next/head';
import NavBar, { PagesInNavbar } from "../../lib/navbar";
import Bus, { BusComponentSizes } from "../../lib/busComponent";
import ConnectionMonitor, { HandleConnQualContext } from "../../lib/connectionMonitorComponent";
import Footer from "../../lib/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import ReactModal from "react-modal";
import Drawer, { DragDirection, DragUpDrawerXLocation, DragUpDrawerYLocation, SpringTension } from "../../lib/dragDrawer";

import styles from "../../styles/School.module.scss";

import { useState, useEffect, useCallback, useContext } from "react";
import Router, { useRouter } from 'next/router';

import MutationQueueContext from "../../lib/mutationQueue";

import permParseFunc from "../../lib/perms";
import { saveBoardingAreaCallback, createBusCallback, clearAllCallback} from "../../lib/editingCallbacks";
import getBoardingArea from "../../lib/boardingAreas";
import UnassignedBoardingAreas from "../../lib/unassignedBoardingAreas";
import { NextSeo } from "next-seo";
import { migrateOldStarredBuses } from "../../lib/utils";
import { EditModeProps } from '../_app';

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
        mappingData {
            boardingAreas {
                name
            }
        }
    }
    currentSchoolScopes(schoolID: $id) 
}
`;

interface BusListProps {
    buses: readonly GetSchoolAndPerms_school_buses[];
 
    editing: false | ReturnType<typeof permParseFunc>;
    editFreeze: boolean;
    eventTarget: EventTarget;

    isStarredList: boolean;
    starredBusIDs: Set<string>;
    starCallback: (id: string, event: MouseEvent<SVGSVGElement>) => void;

    saveBoardingAreaCallback: (id: string) => (boardingArea: string | null) => Promise<void>;

    showCreate: boolean;
    createBusCallback: () => void;
}

function BusList(
    {
        buses,
        editing,
        editFreeze,
        eventTarget,
        isStarredList,
        starredBusIDs,
        starCallback,
        saveBoardingAreaCallback,
        showCreate,
        createBusCallback,
    }: BusListProps
): JSX.Element {
    return <div className={styles.bus_container_container + (isStarredList ? ` ${styles.bus_container_starred_container}` : ``)}>
        <div className={editing ? `${styles.bus_container} ${styles.bus_container_compact}` : styles.bus_container}>
            {buses.map(
                bus => 
                    <Bus
                        key={bus.id}
                                
                        bus={bus}
                        
                        editing={editing}
                        editFreeze={editFreeze}
                        eventTarget={eventTarget}
                        
                        starCallback={(event) => starCallback(bus.id, event)}
                        isStarred={starredBusIDs.has(bus.id)}
                        
                        saveBoardingAreaCallback={saveBoardingAreaCallback(bus.id)}
                        size={editing ? BusComponentSizes.COMPACT : BusComponentSizes.NORMAL}
                    />
            )}
            {showCreate && <a href="#" className={styles.create_bus} onClick={event => {
                event.preventDefault();
                createBusCallback();
            }}><FontAwesomeIcon icon={faPlus} /> Add Bus</a>}
        </div>
    </div>;
}

type SchoolProps = Props<typeof getServerSideProps> & EditModeProps;

export default function School({ school: schoolOrUndef, currentSchoolScopes: permsOrUndef, editMode, setEditMode, editFreeze }: SchoolProps): JSX.Element {
    const school = Object.freeze(schoolOrUndef!);
    const perms = Object.freeze(permParseFunc(Object.freeze(permsOrUndef!)));

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
    
    const editing = editMode && perms;
    const [searchTerm, setSearchTerm] = useState("");

    let setEditModePlusClearSearch = (editMode: boolean) => {
        setEditMode(editMode);
        setSearchTerm("");   
    };

    const [eventTarget] = useState(() => new EventTarget());

    const buses = Object.freeze(filterBuses(returnSortedBuses(school.buses), searchTerm));
    const starredBuses = Object.freeze(buses.filter(bus => starredBusIDs.has(bus.id)));

    const currentMutationQueue = useContext(MutationQueueContext);
    const { handleConnQual } = useContext(HandleConnQualContext);

    const [isResetting, setResetting] = useState<boolean>(false);

    return <div>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <NextSeo title={school.name ?? "School"} />
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
                
                editing={editMode && perms}
                editFreeze={editFreeze}
                eventTarget={eventTarget}

                isStarredList={true}
                starredBusIDs={starredBusIDs}
                starCallback={starCallback}
                
                saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)}

                showCreate={false}
                createBusCallback={() => createBusCallback(currentMutationQueue, handleConnQual, router, school.id)}
            />
        }
    
        <BusList
            buses={buses}
            
            editing={editMode && perms}
            editFreeze={editFreeze}
            eventTarget={eventTarget}

            isStarredList={false}
            starredBusIDs={starredBusIDs}
            starCallback={starCallback}

            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)}

            showCreate={editMode && perms?.bus.create}
            createBusCallback={() => createBusCallback(currentMutationQueue, handleConnQual, router, school.id)}
        />
        {(editMode && perms.bus.updateStatus) && <button className={styles.reset} onClick={() => setResetting(true)}>Reset All</button>}
        <Drawer
            location={{x: DragUpDrawerXLocation.RIGHT, y: DragUpDrawerYLocation.BOTTOM}}
            direction={DragDirection.UP}
            overTension={SpringTension.MEDIUM}
            snapToTension={SpringTension.MEDIUM}
            className={styles.pull_up_drawer}
        >
            {(relativePosition) => <div className={styles.drawer_contents}>
                <UnassignedBoardingAreas boardingAreas={(school as any).mappingData.boardingAreas} buses={buses} eventTarget={eventTarget} relativePosition={relativePosition} />
            </div>}
        </Drawer>
        <ReactModal isOpen={isResetting} style={{
            content: {
                maxWidth: "400px",
                height: "200px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            },
        }}>
            <h3 className={styles.reset_modal_title}>Are you sure you want to reset all buses?</h3>
            <button className={styles.reset_modal_cancel} onClick={() => setResetting(false)}>Cancel</button>
            <button className={styles.reset_modal_confirm} onClick={() => {
                clearAllCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual, school.id);
                setResetting(false);
            }}>Reset</button>
        </ReactModal>
        <Footer />
        <ConnectionMonitor editing={editMode}/>
    </div>;
}


function returnSortedBuses(buses: GetSchoolAndPerms_school_buses[]): GetSchoolAndPerms_school_buses[] {
    const defaultVal = "\u{10FFFD}".repeat(100);

    let availableBuses:   GetSchoolAndPerms_school_buses[] = buses.filter((bus) =>  bus.available);
    availableBuses.sort((a, b) => (a.name || defaultVal).localeCompare(b.name || defaultVal));
    let unavailableBuses: GetSchoolAndPerms_school_buses[] = buses.filter((bus) => !bus.available);
    unavailableBuses.sort((a, b) => (a.name || defaultVal).localeCompare(b.name || defaultVal));
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
