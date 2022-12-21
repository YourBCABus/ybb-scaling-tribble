// GraphQL
import gql from "graphql-tag";
import createNewClient from "@utils/librarystuff/apollo-client";

// Types
import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";

import { Props } from "@general-utils/utils";
import { GetSchoolAndPerms } from "@graph-types/GetSchoolAndPerms";

import { MouseEvent, useMemo } from "react";
import { EditModeProps } from '@pages/_app';

import { BoardingArea, BusData, BusId, MappingBoardingArea, SchoolId } from "@utils/proptypes";


// Meta components
import Head from 'next/head';
import { NextSeo } from "next-seo";
import NoSsr from "@meta/NoSsr";

import PageHeader from "@school-comps/PageHeader";
import Footer from "@other-comps/footer";

import ConnectionMonitor from "@other-comps/connectionMonitorComponent";

// Drawer Components
import Drawer, { DrawerTab, DrawerTabs, SpringTension } from "@drawer/Drawer";
import UnassignedBoardingAreas from "lib/components/drawer/tabs/UnassignedBoardingAreas";
import { Notes } from "lib/components/drawer/tabs/Notes";

// Bus Components
import BusList from "@bus-comps/BusList";

// Control/Visibility Flow Components
import Collapsible from "react-collapsible";
import ResetModal from "@modals/ResetModal";
import ConfirmAreaChangeModal from "@modals/ConfirmAreaChangeModal";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";

// Hooks
import useInterval from "@hooks/useInterval";
import Router from 'next/router';

import { useContext, useState, useCallback } from "react";
import MutationQueueContext, { MutationType } from "@utils/editing/mutation-queue";

import { useStateChangeClientSide } from "@hooks/useStateChange";
import useSearch from "@hooks/useSearch";

// Styles and style handlers
import styles from "@page-styles/School.module.scss";
import { CamelCase } from "@camel-case";
const [style, builder] = CamelCase.wrapCamelCase(styles);

// Editing utility functions
import permParseFunc from "lib/utils/general/perms";

// Misc boarding area functions
import { getInitialStars } from "@utils/setup/school.id.index";
import DragDropEventHandler from "@utils/dragdrop";

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

const preBuilder = {
    inactive: builder.deactivatedBusesAlways,
};

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
    const { name: s_name } = schoolMut;
    const s_id = useMemo(() => new SchoolId(schoolMut.id), [schoolMut.id]);
    const s_buses = useMemo(() => schoolMut.buses.map(data => BusData.fromSchool(data)), [schoolMut.buses]);
    const s_perms = useMemo(() => permParseFunc(permsMut), [permsMut]);

    const s_mappingAreas = useMemo(
        () => schoolMut.mappingData?.boardingAreas.map(MappingBoardingArea.fromGraphQL) ?? [],
        [schoolMut.mappingData?.boardingAreas]
    );


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
    const [confirmBoardingAreaChange, setConfirmBoardingAreaChange] = useState<null | {bus: BusData, boardingArea: MappingBoardingArea}>(null);

    const [drawerEventTarget] = useState(() => new EventTarget());
    
    dragDropEvents.setDropGeneral("School", event => {
        const bus = s_buses.find(bus => bus.id.eq(event.targetId));
        if (!bus) return;
        if (!bus.isArrived) {
            console.log("setting by default");
            dragDropEvents.sendConfirmEvent();
        } else {
            setConfirmBoardingAreaChange({ bus, boardingArea: event.area });
        }
    });
    dragDropEvents.setCancelGeneral("School", () => setConfirmBoardingAreaChange(null));
    dragDropEvents.setConfirmGeneral("School", () => setConfirmBoardingAreaChange(null));

    /**
     * These are contexts, (or routers, which are essentially contexts,) that handle global mutable data.
     * This data persists across pages, but not across reloads or sessions.
     * 
     * TODO
     * FIXME: PHASE THESE OUT.
     * We should be using a localStorage stack instead of a `mutation queue` for more robustness in case of a website crash.
     * HandlConnQual is also kind of a hacky workaround for actually checking the connection quality.
     * 
     * NOTE: @Blckbrry-Pi is working on phasing these out. They'll be in limbo for a bit though.
     */
    const currentMutationQueue = useContext(MutationQueueContext);
    // const { handleConnQual } = useContext(HandleConnQualContext);

    // const router = useRouter();



    useInterval(editing ? 5000 : 15000, updateServerSidePropsFunction);
    

    
    

    const b_active   = searchTerm.filter(s_buses.filter(bus =>  bus.running).sort((b1, b2) => b1.compareName(b2)));
    const b_inactive = searchTerm.filter(s_buses.filter(bus => !bus.running).sort((b1, b2) => b1.compareName(b2)));
    const b_starred  = b_active.filter(bus => starred.has(bus.id.toString()));


    const showInactive = b_inactive.length > 0 && editing;
    const showStarred = b_starred.length > 0 && !editMode;



    const setEditModePlusClearSearch = (mode: boolean) => {
        setEditMode(mode);
        searchTerm.setTerm("");   
    };

    const drawerTabs: DrawerTabs = {
        [DrawerTab.UNASSIGNED]: relativePos => (
            <div className={style.drawerContents}>
                <UnassignedBoardingAreas boardingAreas={s_mappingAreas} buses={b_active} dragDropHandler={dragDropEvents} relativePosition={relativePos} allowDragging={s_perms.bus.updateStatus} />
            </div>
        ),
        [DrawerTab.NOTES]: () => (
            <div className={builder.drawerContents.drawerContentsNotes()}>
                <Notes schoolID={s_id} focusBlurEventTarget={drawerEventTarget} />
                <div className={style.notesHintText}>Notes are not synced across devices.</div>
            </div>
        ),
    };

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

    const drawer = (
        <Drawer
            overTension={SpringTension.MEDIUM}
            snapToTension={SpringTension.MEDIUM}
            drawerEventTarget={drawerEventTarget}
            className={style.pullUpDrawer ?? ""}
            tabs={drawerTabs[drawerTab]}>
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
        </Drawer>
    );
    const resetCallback = useCallback(() => currentMutationQueue.enqueue({
        __type: MutationType.CL_ALL,
        s_id,
    }).then(updateServerSidePropsFunction), [currentMutationQueue, s_id]);
    const modals = <>
        {/**
         * Modal that pops up and confirms that you really do want to clear all of the boarding areas on all of the buses.
         */}
        <ResetModal
            showing={isResetting}
            hide={useCallback(() => setResetting(false), [])}
            resetCallback={resetCallback}/>

        {/**
         * Modal that pops up and confirms that you really do want to overwrite a bus's boarding area.
         */}
        <ConfirmAreaChangeModal
            showing={!!confirmBoardingAreaChange}
            cancel={() => dragDropEvents.sendCancelEvent()}
            confirm={() => dragDropEvents.sendConfirmEvent()}
            bus={confirmBoardingAreaChange?.bus}
            newBoardingArea={confirmBoardingAreaChange?.boardingArea}/>
    </>;

    const floatingComponents = <NoSsr>
        {drawer}
        {modals}
        <ConnectionMonitor editing={editMode}/>
    </NoSsr>;

    const saveBoardingAreaCallback = useCallback(
        (id: BusId) => (area: BoardingArea) => currentMutationQueue.enqueue({
            __type: MutationType.UP_B_BOARD,
            s_id,
            b_id: id,
            b_area: area,
        }).then(updateServerSidePropsFunction),
        [s_id, currentMutationQueue],
    );

    const createBusCallback = useCallback(
        () => currentMutationQueue.enqueue({
            __type: MutationType.CL_ALL,
            s_id,
        }).then(updateServerSidePropsFunction),
        [s_id, currentMutationQueue],
    );

    const commonBusProps = {
        editing: editMode ? s_perms : undefined,
        editFreeze,
        dragDropHandler: dragDropEvents,
        starredBusIDs: starred,
        starCallback,

        saveBoardingAreaCallback,
        createBusCallback,
    };

    /**
     * Starred buses, only visible if NOT editing.
     */
    const starredList = showStarred && (
        <BusList
            {...commonBusProps}

            buses={b_starred}
            isStarredList={true}

            showCreate={false} />
    );

    /**
     * Active buses, always visible.
     */
    const activeList = (
        <BusList
            {...commonBusProps}

            buses={b_active}
            isStarredList={false}

            showCreate={editMode && s_perms?.bus.create} />
    );

    /**
     * Inactive list, only visible if editing.
     */
    const inactiveList = showInactive && (
        <BusList
            {...commonBusProps}

            buses={b_inactive}
            isStarredList={false}
        
            showCreate={false} />
    );

    return <div>
        {top}

        {starredList}
        {activeList}

        {
            showInactive && <Collapsible
                className={preBuilder.inactive.deactivatedBusesClosed()}
                openedClassName={preBuilder.inactive()}
                trigger={<div>View deactivated buses <FontAwesomeIcon icon={faAngleUp} size="lg"/></div>}
                transitionTime={100}>
                {inactiveList}
            </Collapsible>
        }

        {(editMode && s_perms.bus.updateStatus) && <button className={styles.reset} onClick={() => setResetting(true)}>Reset All</button>}

        {floatingComponents}
        <Footer />
    </div>;
}

const filterBuses = (bus: BusData, searchTerm: string): boolean => {
    const term = searchTerm.trim().toLowerCase();
    const { name } = bus;

    // By bus name
    if (name?.toLowerCase().includes(term)) return true;
    // By bus boarding area
    if (bus.boardingArea.includes(term)) return true;
    // By bus ID (must EXACTLY && COMPLETELY match)
    if (bus.id.equals(term)) return true;
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
