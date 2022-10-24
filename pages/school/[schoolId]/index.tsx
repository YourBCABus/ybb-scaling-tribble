import createNewClient from "lib/utils/librarystuff/apollo-client";
import gql from "graphql-tag";
import { GetSchoolAndPerms, GetSchoolAndPerms_school_buses } from "__generated__/GetSchoolAndPerms";

import { Props } from "lib/utils/general/utils";
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { MouseEvent } from "react";

import Head from 'next/head';
import NavBar, { PagesInNavbar } from "lib/components/other/navbar";
import Bus, { BusComponentSizes } from "lib/components/buses/Bus";
import ConnectionMonitor, { HandleConnQualContext } from "lib/components/other/connectionMonitorComponent";
import Footer from "lib/components/other/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp, faArrowDown, faSearch } from "@fortawesome/free-solid-svg-icons";
import ReactModal from "react-modal";
import Drawer, { DragDirection, DragUpDrawerXLocation, DragUpDrawerYLocation, SpringTension } from "lib/components/drawer/dragDrawer";

import styles from "styles/School.module.scss";

import { useCallback, useContext, useEffect, useState } from "react";
import Router, { useRouter } from 'next/router';

import MutationQueueContext from "lib/utils/general/mutationQueue";

import permParseFunc, { maskPerms } from "lib/utils/general/perms";
import { clearAllCallback, createBusCallback, saveBoardingAreaCallback} from "lib/utils/general/editingCallbacks";
import getBoardingArea from "lib/utils/general/boardingAreas";
import { NextSeo } from "next-seo";
import { migrateOldStarredBuses } from "lib/utils/general/utils";
import { DrawerTab, EditModeProps } from 'pages/_app';
import Collapsible from "react-collapsible";
import { Notes } from "lib/components/other/Notes";
import BusList from "lib/components/buses/BusList";
import { ApolloError } from "@apollo/client";
import useInterval from "lib/utils/hooks/useInterval";

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

type SchoolProps = Props<typeof getServerSideProps> & EditModeProps;

export default function School({
    school: schoolMut,
    currentSchoolScopes: permsMut,
    editMode, setEditMode, editFreeze,
    drawerTab, setDrawerTab,
}: SchoolProps): JSX.Element {
    if (!schoolMut || !permsMut) throw new Error("School and/or scopes are not defined");

    const school = Object.freeze(schoolMut);
    const perms = Object.freeze(permParseFunc(Object.freeze(permsMut)));

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
    
    useInterval(editMode ? 5000 : 15000, updateServerSidePropsFunction);
    


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

    const setEditModePlusClearSearch = (editMode: boolean) => {
        setEditMode(editMode);
        setSearchTerm("");   
    };

    const [eventTarget] = useState(() => new EventTarget());
    const [confirmBoardingAreaChange, setConfirmBoardingAreaChange] = useState<null | {bus: GetSchoolAndPerms_school_buses, boardingArea: string}>(null);

    const [drawerEventTarget] = useState(() => new EventTarget());

    useEffect(() => {
        const forwardToBlurCallback = () => {
            drawerEventTarget.dispatchEvent(new Event('blur'));
        };

        const triggers = ['open', 'close', 'move'];

        triggers.forEach(trigger => drawerEventTarget.addEventListener(trigger, forwardToBlurCallback));

        return () => triggers.forEach(trigger => drawerEventTarget.removeEventListener(trigger, forwardToBlurCallback));
    }, [drawerEventTarget]);

    useEffect(() => {
        const setConfirmState = (event: Event) => {
            if (event instanceof CustomEvent) {
                setConfirmBoardingAreaChange(event.detail);
            }
        };
        eventTarget.addEventListener("startConfirm", setConfirmState);

        return () => eventTarget.removeEventListener("startConfirm", setConfirmState);
    });

    const { active: activeUnfiltered, unactive: unactiveUnfiltered } = returnSortedBuses(school.buses);

    const activeBuses = Object.freeze(filterBuses(activeUnfiltered, searchTerm));
    const unactiveBuses = Object.freeze(filterBuses(unactiveUnfiltered, searchTerm));
    const starredBuses = Object.freeze(activeBuses.filter(bus => starredBusIDs.has(bus.id)));

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
                
                editing={editMode ? maskPerms(perms, { bus: { create: false } }) : undefined}
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
            buses={activeBuses}
            
            editing={editMode ? perms : undefined}
            editFreeze={editFreeze}
            eventTarget={eventTarget}

            isStarredList={false}
            starredBusIDs={starredBusIDs}
            starCallback={starCallback}

            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)}

            showCreate={editMode && perms?.bus.create}
            createBusCallback={() => createBusCallback(currentMutationQueue, handleConnQual, router, school.id)}
        />
        {
            unactiveBuses.length > 0 && editing && <Collapsible
                className={`${styles.deactivated_buses_closed} ${styles.deactivated_buses_always}`}
                openedClassName={styles.deactivated_buses_always}
                trigger={<div>View deactivated buses <FontAwesomeIcon icon={faAngleUp} size="lg"/></div>}
                transitionTime={100}
            >
                <BusList
                    buses={unactiveBuses}
                    
                    editing={editMode && maskPerms(perms, { bus: { create: false } })}
                    editFreeze={editFreeze}
                    eventTarget={eventTarget}

                    isStarredList={false}
                    starredBusIDs={starredBusIDs}
                    starCallback={starCallback}

                    showCreate={false}
                    createBusCallback={() => createBusCallback(currentMutationQueue, handleConnQual, router, school.id)}
                />
            </Collapsible>
        }
        {(editMode && perms.bus.updateStatus) && <button className={styles.reset} onClick={() => setResetting(true)}>Reset All</button>}
        {editMode && <Drawer
            location={{x: DragUpDrawerXLocation.RIGHT, y: DragUpDrawerYLocation.BOTTOM}}
            direction={DragDirection.UP}
            overTension={SpringTension.MEDIUM}
            snapToTension={SpringTension.MEDIUM}
            drawerEventTarget={drawerEventTarget}
            className={styles.pull_up_drawer}
        >
            <div className={styles.drawer_tab_bar}>
                <button className={`${styles.drawer_tab} ${drawerTab === DrawerTab.UNASSIGNED ? styles.drawer_tab_active : ""}`} onClick={() => setDrawerTab(DrawerTab.UNASSIGNED)}>Boarding Areas</button>
                <button className={`${styles.drawer_tab} ${drawerTab === DrawerTab.NOTES ? styles.drawer_tab_active : ""}`} onClick={() => setDrawerTab(DrawerTab.NOTES)}>Notes</button>
            </div>
            {/* {drawerTab === DrawerTab.UNASSIGNED && <div className={styles.drawer_contents}>
                <UnassignedBoardingAreas boardingAreas={(school as any).mappingData.boardingAreas} buses={activeBuses} eventTarget={eventTarget} relativePosition={relativePosition} allowDragging={perms.bus.updateStatus} />
            </div>} */}
            {drawerTab === DrawerTab.NOTES ? <div className={`${styles.drawer_contents} ${styles.drawer_contents_notes}`}>
                <Notes schoolID={school.id} focusBlurEventTarget={drawerEventTarget} />
                <div className={styles.notes_hint_text}>Notes are not synced across devices.</div>
            </div> : <></>}
        </Drawer>}
        <ReactModal isOpen={isResetting} style={{
            content: {
                width: "80%",
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
        <ReactModal isOpen={!!confirmBoardingAreaChange} style={{
            content: {
                width: "80%",
                maxWidth: "400px",
                height: "230px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            },
        }}>
            {confirmBoardingAreaChange && <>
                <h3 className={styles.reset_modal_title}>Are you sure you want to change this bus&#39;s boarding area?</h3>
                <Bus
                    bus={confirmBoardingAreaChange.bus}
                    isStarred={false}
                    starCallback={() => void 0}
                    editFreeze={true}
                    noLink={true}
                    size={BusComponentSizes.COMPACT}
                />
                <div className={styles.down_arrow_div}><FontAwesomeIcon icon={faArrowDown} size="2x"></FontAwesomeIcon></div>
                <Bus
                    bus={{...confirmBoardingAreaChange.bus, boardingArea: confirmBoardingAreaChange.boardingArea}}
                    isStarred={false}
                    starCallback={() => void 0}
                    editFreeze={true}
                    noLink={true}
                    size={BusComponentSizes.COMPACT}
                />
                <br/>
                <button className={styles.reset_modal_cancel} onClick={() => {
                    setConfirmBoardingAreaChange(null);
                    eventTarget.dispatchEvent(new CustomEvent("cancel"));
                }}>Cancel</button>
                <button className={styles.reset_modal_confirm} onClick={() => {
                    setConfirmBoardingAreaChange(null);
                    eventTarget.dispatchEvent(new CustomEvent("confirm"));
                }}>Change</button>
            </>}
        </ReactModal>
        <Footer />
        <ConnectionMonitor editing={editMode}/>
    </div>;
}


function returnSortedBuses(buses: GetSchoolAndPerms_school_buses[]): { active: GetSchoolAndPerms_school_buses[], unactive: GetSchoolAndPerms_school_buses[] } {
    const defaultVal = "\u{10FFFD}".repeat(100);

    const availableBuses:   GetSchoolAndPerms_school_buses[] = buses.filter((bus) =>  bus.available);
    availableBuses.sort((a, b) => (a.name || defaultVal).localeCompare(b.name || defaultVal));
    const unavailableBuses: GetSchoolAndPerms_school_buses[] = buses.filter((bus) => !bus.available);
    unavailableBuses.sort((a, b) => (a.name || defaultVal).localeCompare(b.name || defaultVal));
    return {
        active: availableBuses,
        unactive: unavailableBuses,
    };
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
    console.log(context.params);
    try {
        const params = context.params;
        if (params === undefined) throw new Error("Null context params!");
        
        const { data } = await client.query<GetSchoolAndPerms>({query: GET_SCHOOL_AND_PERMS, variables: {id: params.schoolId}, context: {req: context.req}});
        
        return {
            props: data,
        };
    } catch (e) {
        console.error(e);

        if (typeof e === 'object' && e !== null) {
            if (e instanceof ApolloError) {
                const networkError = e.networkError;
                if (networkError) {
                    console.log(e.networkError);
                }
            }
        }

        return {
            notFound: true,
            props: { school: null, currentSchoolScopes: null },
        };
    }
};
