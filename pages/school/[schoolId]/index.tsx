// GraphQL
import gql from "graphql-tag";
import createNewClient from "@utils/librarystuff/apollo-client";

// Types
import { GetServerSideProps } from "next";

import { GetSchoolAndPerms, GetSchoolAndPerms_school } from "@graph-types/GetSchoolAndPerms";

import { FC } from "react";
import { PageGlobalProps } from '@pages/_app';

import { BoardingArea, BusData, BusId, MappingBoardingArea } from "@utils/proptypes";


// Meta components
import Head from 'next/head';
import { NextSeo } from "next-seo";
import NoSsr from "@meta/NoSsr";

import Footer from "@meta/Footer";
import ConnectionMonitor from "@meta/ConnectionMonitor";

// Non-meta Components
import PageHeader from "@school-comps/PageHeader";
import BusList from "@bus-comps/BusList";

import { Collapsible, ResetModal, ConfirmAreaChangeModal } from "@modals/index";
import Drawer, { DrawerTab, DrawerTabs, SpringTension, tabs } from "@drawer/Drawer";
const { Notes, UnassignedBoardingAreas } = tabs;

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";

// Hooks
import { useContext, useState, useCallback } from "react";
import { useInterval, usePerms, useSchool, useSearch, useStars } from "@hooks";
import MutationQueueContext, { MutationType, updateServerSidePropsFunction } from "@utils/editing/mutation-queue";

// Styles and style utils
import styles from "@page-styles/School.module.scss";
import { CamelCase } from "@camel-case";
const [style, builder] = CamelCase.wrapCamelCase(styles);

// Utils
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

interface SchoolProps {
    school: GetSchoolAndPerms_school,
    perms: string[],
}

const styleMemo = {
    bInactive: builder.deactivatedBusesAlways,
    dTab: builder.drawerTab,
    dContent: builder.drawerContents,
};



const School: FC<SchoolProps & PageGlobalProps> = (props) => {
    const s_perms = usePerms(props.perms);

    const {
        s_name,
        s_id,
        s_buses,
        s_mappingAreas,
    } = useSchool(props.school);

    const {
        g_eMode, g_eModeSet,
        g_eFreeze,
        g_dTab, g_dTabSet,
    } = props;


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
    const [starred, starCallback] = useStars();
    // const starCallback = useCallback(
    //     (id, event) => makeStarCallback(setStarred, starred)(id, event),
    //     [setStarred, starred],
    // );

    const b_searchTerm = useSearch(filterBuses, "");
    const [s_resetting, s_resettingSet] = useState<boolean>(false);

    const s_editing = g_eMode && s_perms;

    /**
     * TECHNICALLY these are also states, but they're planned to be phased out.
     * The way they function is riddled with mutability and callback hell.
     * 
     * FIXME: Come up with SOME alternative to this event target mess.
     */
    const [s_dDragEvents] = useState(() => new DragDropEventHandler());
    const [confirmBoardingAreaChange, setConfirmBoardingAreaChange] = useState<null | {bus: BusData, boardingArea: MappingBoardingArea}>(null);

    
    s_dDragEvents.setDropGeneral("School", event => {
        const bus = s_buses.find(bus => bus.id.eq(event.targetId));
        if (!bus) return;
        if (!bus.isArrived) {
            s_dDragEvents.sendConfirmEvent();
        } else {
            setConfirmBoardingAreaChange({ bus, boardingArea: event.area });
        }
    });
    s_dDragEvents.setCancelGeneral("School", () => setConfirmBoardingAreaChange(null));
    s_dDragEvents.setConfirmGeneral("School", () => setConfirmBoardingAreaChange(null));

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



    useInterval(s_editing ? 5000 : 15000, updateServerSidePropsFunction);
    

    
    

    const b_active   = b_searchTerm.filter(s_buses.filter(bus =>  bus.running).sort((b1, b2) => b1.compareName(b2)));
    const b_inactive = b_searchTerm.filter(s_buses.filter(bus => !bus.running).sort((b1, b2) => b1.compareName(b2)));
    const b_starred  = b_active.filter(bus => starred.has(bus.id.toString()));

    const permSwitches = {
        showInactive: b_inactive.length > 0 && s_editing,
        showStarred: b_starred.length > 0 && !g_eMode,
        showCreate: s_perms.bus.create && g_eMode,
        updateStatus: s_perms.bus.updateStatus && g_eMode,
    };

    const editModeSet = (mode: boolean) => {
        g_eModeSet(mode);
        b_searchTerm.setTerm("");   
    };

    const drawerTabs: DrawerTabs = {
        [DrawerTab.UNASSIGNED]: relativePos => (
            <div className={style.drawerContents}>
                <UnassignedBoardingAreas
                    boardingAreas={s_mappingAreas}
                    buses={b_active}
                    dragDropHandler={s_dDragEvents} relativePosition={relativePos} allowDragging={permSwitches.updateStatus} />
            </div>
        ),
        [DrawerTab.NOTES]: () => (
            <div className={builder.drawerContents.drawerContentsNotes()}>
                <Notes schoolID={s_id} />
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
            search={b_searchTerm}
            schoolName={s_name ?? "School"}
            editing={!!s_editing}
            setEditing={editModeSet}
            canEdit={s_perms.bus.updateStatus} />
    </>;

    const drawer = (
        <Drawer
            overTension={SpringTension.MEDIUM}
            snapToTension={SpringTension.MEDIUM}
            className={style.pullUpDrawer ?? ""}
            tabs={drawerTabs[g_dTab]}>
            <div className={style.drawerTabBar} >
                <button
                    className={builder.drawerTab.IF(g_dTab === DrawerTab.UNASSIGNED).drawerTabActive()}
                    onClick={() => g_dTabSet(DrawerTab.UNASSIGNED)}>
                        Boarding Areas
                </button>

                <button
                    className={builder.drawerTab.IF(g_dTab === DrawerTab.NOTES).drawerTabActive()}
                    onClick={() => g_dTabSet(DrawerTab.NOTES)}>
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
            showing={s_resetting}
            hide={useCallback(() => s_resettingSet(false), [])}
            resetCallback={resetCallback}/>

        {/**
         * Modal that pops up and confirms that you really do want to overwrite a bus's boarding area.
         */}
        <ConfirmAreaChangeModal
            showing={!!confirmBoardingAreaChange}
            cancel={() => s_dDragEvents.sendCancelEvent()}
            confirm={() => s_dDragEvents.sendConfirmEvent()}
            bus={confirmBoardingAreaChange?.bus}
            newBoardingArea={confirmBoardingAreaChange?.boardingArea}/>
    </>;

    const floatingComponents = <NoSsr>
        {drawer}
        {modals}
        <ConnectionMonitor editing={g_eMode}/>
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
        editing: g_eMode ? s_perms : undefined,
        editFreeze: g_eFreeze,
        dragDropHandler: s_dDragEvents,
        starredBusIDs: starred,
        starCallback,

        saveBoardingAreaCallback,
        createBusCallback,
    };

    /**
     * Starred buses, only visible if NOT editing.
     */
    const starredList = permSwitches.showStarred && (
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

            showCreate={permSwitches.showCreate} />
    );

    /**
     * Inactive list, only visible if editing.
     */
    const inactiveList = permSwitches.showInactive && (
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
            permSwitches.showInactive && <Collapsible
                className={styleMemo.bInactive.deactivatedBusesClosed()}
                openedClassName={styleMemo.bInactive()}
                trigger={<div>View deactivated buses <FontAwesomeIcon icon={faAngleUp} size="lg"/></div>}
                transitionTime={100}>
                {inactiveList}
            </Collapsible>
        }

        {permSwitches.updateStatus && <button className={styles.reset} onClick={() => s_resettingSet(true)}>Reset All</button>}

        {floatingComponents}
        <Footer />
    </div>;
};

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

export const getServerSideProps: GetServerSideProps<SchoolProps> = async (context) => {    
    const client = createNewClient();
    try {
        const params = context.params;
        if (params === undefined) throw new Error("Null context params!");
        
        const { data: { school, currentSchoolScopes: perms } } = await client.query<GetSchoolAndPerms>({
            query: GET_SCHOOL_AND_PERMS,
            variables: {id: params.schoolId},
            context: {req: context.req},
        });
        
        if (!school) throw new Error("i don't like you.");

        return {props: {
            school,
            perms,
        }};
    } catch (e) {
        console.error(e);

        return {
            notFound: true,
        };
    }
};

export default School;
