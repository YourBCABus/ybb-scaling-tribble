// GraphQL
import gql from "graphql-tag";
import createNewClient from "lib/utils/librarystuff/apollo-client";

// Types
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";

import { Immutable, makeImmut, Props } from "lib/utils/general/utils";
import { GetSchoolAndPerms, GetSchoolAndPerms_school_buses } from "__generated__/GetSchoolAndPerms";

import { MouseEvent } from "react";


// Meta components
import Head from 'next/head';
import { NextSeo } from "next-seo";
import NoSsr from "lib/components/other/noSSRComponent";

import PageHeader from "lib/components/schools/PageHeader";
import Footer from "lib/components/other/footer";

import ConnectionMonitor, { HandleConnQualContext } from "lib/components/other/connectionMonitorComponent";


// Drawer Components
import Drawer, { DrawerTab, DrawerTabs, SpringTension } from "lib/components/drawer/Drawer";
import { EditModeProps } from 'pages/_app';

// Bus Components
import BusList from "lib/components/buses/BusList";

// Control/Visibility Flow Components
import Collapsible from "react-collapsible";
import ResetModal from "lib/components/modals/ResetModal";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";

// Hooks
import useInterval from "lib/utils/hooks/useInterval";
import Router, { useRouter } from 'next/router';

import { useContext, useEffect, useState, useCallback } from "react";
import MutationQueueContext from "lib/utils/general/mutationQueue";

import { useStateChangeClientSide } from "lib/utils/hooks/useStateChange";
import useSearch from "lib/utils/hooks/useSearch";

// Styles and style handlers
import styles from "styles/School.module.scss";
import { CamelCase } from "lib/utils/style/styleproxy";
const [style, builder] = CamelCase.wrapCamelCase(styles);

// Editing utility functions
import { clearAllCallback, createBusCallback, saveBoardingAreaCallback} from "lib/utils/general/editingCallbacks";
import permParseFunc, { maskPerms } from "lib/utils/general/perms";

// Misc boarding area functions
import getBoardingArea from "lib/utils/general/boardingAreas";
import { getInitialStars } from "lib/utils/setup/school.id.index";
import ConfirmAreaChangeModal from "lib/components/modals/ConfirmAreaChangeModal";
import { BusObj } from "lib/components/buses/Bus";
import DragDropEventHandler from "lib/utils/dragdrop/events";
import UnassignedBoardingAreas from "lib/components/drawer/tabs/unassignedBoardingAreas";
import { Notes } from "lib/components/drawer/tabs/Notes";

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

const defaultBusNameCmpVal = "\u{10FFFD}".repeat(100);
const busNameCmpFn = (a: Immutable<BusObj>, b: Immutable<BusObj>) => (a.name || defaultBusNameCmpVal).localeCompare(b.name || defaultBusNameCmpVal);


const updateServerSidePropsFunction = () => {
    const currRouter = Router;
    return currRouter.replace(currRouter.asPath, undefined, {scroll: false});
};


const makeStarCallback = (
    setStarredSet: (newStarred: Set<string>) => void,
    currStarred: Set<string>,
) => (id: string, event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const newStarred = new Set(currStarred);
    if (newStarred.has(id)) newStarred.delete(id);
    else newStarred.add(id);

    setStarredSet(newStarred);
};
// (
//     starredSet: Set<string>,
// ) => (
//     id: string,
//     event: MouseEvent<SVGSVGElement>,
// ) => {
//     event.stopPropagation();
//     event.preventDefault();

//     const starred = new Set(starredSet);
//     starred.has(id)
//         ? starred.delete(id)
//         : starred.add(id);
    
//     setStarredSet(starred);
// };

export default function School({
    school: schoolMut,
    currentSchoolScopes: permsMut,
    editMode, setEditMode, editFreeze,
    drawerTab, setDrawerTab,
}: SchoolProps): JSX.Element {
    // TODO: Make an "Unreachable" error type for self-documentation?
    // This should never happen, as school and perms should only ever be null when notFound is true.
    if (!schoolMut || !permsMut) throw new Error("School and/or scopes are not defined");


    
    // These are just for prevention of accidental mutation.
    const { buses: s_buses, id: s_id, name: s_name } = makeImmut(schoolMut);
    const s_perms = makeImmut(permParseFunc(permsMut));

    const dragDropAreaNames = schoolMut.mappingData?.boardingAreas.map(area => area.name) ?? [];


    /**
     * ALL state variables *should* go here, at the top of the function.
     * 
     * `starredBusIDs` is a set of all of the bus IDs that are starred.
     * Any changes passed to `setStarredBusIDs` will replicate to localstorage and to `starredBusIDs.
     * 
     * 
     * `searchTerm` is a filter object that can be used to search for buses by name, boarding area, or id.
     * `setSearchTerm` can be used to remake the filtering object.
     */

    // Load and store the IDs of the starred buses.
    const [starred, setStarred] = useStateChangeClientSide(
        getInitialStars,
        (_, newStarIDs) => localStorage.setItem(
            "starred",
            JSON.stringify([...newStarIDs]),
        ),
        new Set(),
    );
    const starCallback = useCallback(
        (id, event) => makeStarCallback(setStarred, starred)(id, event),
        [setStarred, starred],
    );

    const searchTerm = useSearch(filterBuses, "");
    const [isResetting, setResetting] = useState<boolean>(false);

    const editing = editMode && s_perms;

    /**
     * TECHNICALLY these are also states, but they're planned to be phased out.
     * The way they function is riddled with mutability and callback hell.
     * 
     * FIXME: Come up with SOME alternative to this event target mess.
     */
    const [dragDropEvents] = useState(() => new DragDropEventHandler());
    const [confirmBoardingAreaChange, setConfirmBoardingAreaChange] = useState<null | {bus: GetSchoolAndPerms_school_buses, boardingArea: string}>(null);

    const [drawerEventTarget] = useState(() => new EventTarget());
    
    /**
     * These are contexts, (or routers, which are essentially contexts,) that handle global mutable data.
     * This data persists across pages, but not across reloads or sessions.
     * 
     * TODO
     * FIXME: PHASE THESE OUT.
     * We should be using a localStorage stack instead of a `mutation queue` for more robustness in case of a website crash.
     * HandlConnQual is also kind of a hacky workaround for actually checking the connection quality.
     */
    const currentMutationQueue = useContext(MutationQueueContext);
    const { handleConnQual } = useContext(HandleConnQualContext);

    const router = useRouter();



    useInterval(editing ? 5000 : 15000, updateServerSidePropsFunction);
    

    
    

    const b_active   = searchTerm.filter(s_buses.filter(bus =>  bus.available).sort(busNameCmpFn));
    const b_inactive = searchTerm.filter(s_buses.filter(bus => !bus.available).sort(busNameCmpFn));
    const b_starred  = b_active.filter(bus => starred.has(bus.id));


    const showInactive = b_inactive.length > 0 && editing;
    const showStarred = b_starred.length > 0 && !editMode;


    const setEditModePlusClearSearch = (mode: boolean) => {
        setEditMode(mode);
        searchTerm.setTerm("");   
    };


    useEffect(() => {
        const forwardToBlurCallback = () => {
            drawerEventTarget.dispatchEvent(new Event('blur'));
        };

        const triggers = ['open', 'close', 'move'];

        triggers.forEach(trigger => drawerEventTarget.addEventListener(trigger, forwardToBlurCallback));

        return () => triggers.forEach(trigger => drawerEventTarget.removeEventListener(trigger, forwardToBlurCallback));
    }, [drawerEventTarget]);

    // useEffect(() => {
    //     const setConfirmState = (event: Event) => {
    //         if (event instanceof CustomEvent) {
    //             setConfirmBoardingAreaChange(event.detail);
    //         }
    //     };
    //     eventTarget.addEventListener("startConfirm", setConfirmState);

    //     return () => eventTarget.removeEventListener("startConfirm", setConfirmState);
    // });



    const drawerTabs: DrawerTabs = {
        [DrawerTab.UNASSIGNED]: relativePos => (
            <div className={styles.drawer_contents}>
                <UnassignedBoardingAreas boardingAreas={dragDropAreaNames} buses={b_active} dragDropHandler={dragDropEvents} relativePosition={relativePos} allowDragging={s_perms.bus.updateStatus} />
            </div>
        ),
        [DrawerTab.NOTES]: () => (
            <div className={builder.drawerContents.drawerContentsNotes()}>
                <Notes schoolID={s_id} focusBlurEventTarget={drawerEventTarget} />
                <div className={style.notesHintText}>Notes are not synced across devices.</div>
            </div>
        ),
    };

    // </div>
    // {drawerTab === DrawerTab.UNASSIGNED ? <div className={styles.drawer_contents}>
    //     <UnassignedBoardingAreas boardingAreas={dragDropAreaNames} buses={b_active} dragDropHandler={dragDropEvents} relativePosition={relativePosition} allowDragging={s_perms.bus.updateStatus} />
    // </div> : <></>}
    // {drawerTab === DrawerTab.NOTES ? <div className={builder.drawerContents.drawerContentsNotes()}>
    //     <Notes schoolID={s_id} focusBlurEventTarget={drawerEventTarget} />
    //     <div className={style.notesHintText}>Notes are not synced across devices.</div>

    const top = <>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <NextSeo title={s_name ?? "School"} />
        
        <PageHeader
            search={searchTerm}
            schoolName={s_name ?? "School"}
            editing={!!editing}
            setEditing={setEditModePlusClearSearch}
            canEdit={s_perms.bus.updateStatus} />
    </>;

    const floatingComponents = <NoSsr>
        <Drawer
            overTension={SpringTension.MEDIUM}
            snapToTension={SpringTension.MEDIUM}
            drawerEventTarget={drawerEventTarget}
            className={style.pullUpDrawer ?? ""}
            tabs={drawerTabs[drawerTab]} >
            
            <div className={style.drawerTabBar} >
                <button
                    className={builder.drawerTab.IF(drawerTab === DrawerTab.UNASSIGNED).drawerTabActive()}
                    onClick={() => setDrawerTab(DrawerTab.UNASSIGNED)}>
                        Boarding Areas
                </button>

                <button
                    className={builder.drawerTab.IF(drawerTab === DrawerTab.NOTES).drawerTabActive()}
                    onClick={() => setDrawerTab(DrawerTab.NOTES)}>
                        Notes
                </button>
            </div>
            {/* <button
                className={builder.drawerTab.IF(drawerTab === DrawerTab.NOTES).drawerTabActive()}
                onClick={() => setDrawerTab(DrawerTab.NOTES)}>
                    Notes
            </button> */}
        </Drawer>
        
        {/**
         * Modal that pops up and confirms that you really do want to clear all of the boarding areas on all of the buses.
         */}
        <ResetModal
            showing={isResetting}
            hide={useCallback(() => setResetting(false), [])}
            resetCallback={() => clearAllCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual, s_id)}/>

        {/**
         * Modal that pops up and confirms that you really do want to overwrite a bus's boarding area.
         */}
        <ConfirmAreaChangeModal
            showing={!!confirmBoardingAreaChange}
            cancel={() => {
                setConfirmBoardingAreaChange(null);
                dragDropEvents.sendCancelEvent();
            }}
            confirm={() => {
                setConfirmBoardingAreaChange(null);
                dragDropEvents.sendConfirmEvent();
            }}
            bus={confirmBoardingAreaChange?.bus}
            newBoardingArea={confirmBoardingAreaChange?.boardingArea}/>
        
        <ConnectionMonitor editing={editMode}/>

    </NoSsr>;

    return <div>
        {top}

        {/**
         * Starred buses, only visible if NOT editing.
         */}
        {
            showStarred && <BusList
                buses={b_starred}
                
                editing={undefined}
                editFreeze={editFreeze}
                dragDropHandler={dragDropEvents}

                isStarredList={true}
                starredBusIDs={starred}
                starCallback={starCallback}
                
                saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)}

                showCreate={false}
                createBusCallback={() => createBusCallback(currentMutationQueue, handleConnQual, router, s_id)}
            />
        }
    
        {/**
         * Active buses, always visible.
         */}
        <BusList
            buses={b_active}
            
            editing={editMode ? s_perms : undefined}
            editFreeze={editFreeze}
            dragDropHandler={dragDropEvents}

            isStarredList={false}
            starredBusIDs={starred}
            starCallback={starCallback}

            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction, currentMutationQueue, handleConnQual)}

            showCreate={editMode && s_perms?.bus.create}
            createBusCallback={() => createBusCallback(currentMutationQueue, handleConnQual, router, s_id)}
        />

        {/**
         * Inactive buses, only visible if editing.
         */}
        {
            showInactive && <Collapsible
                className={builder.deactivatedBusesAlways.deactivatedBusesClosed()}
                openedClassName={builder.deactivatedBusesAlways()}
                trigger={<div>View deactivated buses <FontAwesomeIcon icon={faAngleUp} size="lg"/></div>}
                transitionTime={100}
            >
                <BusList
                    buses={b_inactive}
                    
                    editing={editMode && maskPerms(s_perms, { bus: { create: false } })}
                    editFreeze={editFreeze}
                    dragDropHandler={dragDropEvents}

                    isStarredList={false}
                    starredBusIDs={starred}
                    starCallback={starCallback}

                    showCreate={false}
                    createBusCallback={() => createBusCallback(currentMutationQueue, handleConnQual, router, s_id)}
                />
            </Collapsible>
        }

        {(editMode && s_perms.bus.updateStatus) && <button className={styles.reset} onClick={() => setResetting(true)}>Reset All</button>}

        {floatingComponents}
        <Footer />
    </div>;
}

const filterBuses = (bus: Immutable<GetSchoolAndPerms_school_buses>, searchTerm: string): boolean => {
    const term = searchTerm.trim().toLowerCase();
    const { name, invalidateTime } = bus;

    // By bus name
    if (name?.toLowerCase().includes(term)) return true;
    // By bus boarding area
    if (invalidateTime) if (
        typeof invalidateTime === "number" ||
        typeof invalidateTime === "string" ||
        typeof invalidateTime === "object" && invalidateTime instanceof Date
    ) {
        const lowercaseBoardingArea = getBoardingArea(bus.boardingArea, new Date(invalidateTime)).toLowerCase();
        if (lowercaseBoardingArea.includes(term)) return true;
    }
    // By bus ID (must EXACTLY && COMPLETELY match)
    if (bus.id.toLowerCase() === term) return true;
    // If the search term is `?` it matches
    if (term === "?") return true;
    
    return false;
};


export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {    
    const client = createNewClient();
    try {
        const params = context.params;
        if (params === undefined) throw new Error("Null context params!");
        
        const { data } = await client.query<GetSchoolAndPerms>({
            query: GET_SCHOOL_AND_PERMS,
            variables: {id: params.schoolId},
            context: {req: context.req},
        });
        
        return { props: data };
    } catch (e) {
        console.error(e);

        return {
            notFound: true,
            props: { school: null, currentSchoolScopes: null },
        };
    }
};
