import React, { MouseEvent, useCallback, useMemo } from "react";
import { GetSchoolAndPerms_school_buses } from "__generated__/GetSchoolAndPerms";
import permParseFunc from "lib/utils/perms";
import Bus, { BusComponentSizes } from "./Bus";

import styles from 'styles/components/buses/BusList.module.scss';
import CreateBus from "./CreateBus";
import { CamelCase } from "lib/utils/style/styleProxy";
import useMemoMap from "lib/utils/hooks/useMemoMap";
import useMemoizedBuilder from "lib/utils/hooks/useMemoizedBuilder";

const [classes, styleBuilder] = CamelCase.wrapCamelCase(styles);

const busContContBldr = styleBuilder.busContCont;
const busContBldr = styleBuilder.busCont;


export interface BusListProps {
    buses: readonly GetSchoolAndPerms_school_buses[];
 
    editing?: ReturnType<typeof permParseFunc>;
    editFreeze: boolean;
    eventTarget: EventTarget;

    isStarredList: boolean;
    starredBusIDs: Set<string>;
    starCallback: (id: string, event: MouseEvent<SVGSVGElement>) => void;

    saveBoardingAreaCallback?: (id: string) => (boardingArea: string | null) => Promise<void>;

    showCreate: boolean;
    createBusCallback: () => void;
}

namespace __BusListTypeSepPropsNamespace {

    type Buses = BusListProps["buses"];
    type Editing = BusListProps["editing"];
    type EditFreeze = BusListProps["editFreeze"];
    type IsStarredList = BusListProps["isStarredList"];
    type StarredBusIDs = BusListProps["starredBusIDs"];
    type StarCallback = BusListProps["starCallback"];
    type SaveBoardingAreaCallback = BusListProps["saveBoardingAreaCallback"];
    type ShowCreate = BusListProps["showCreate"];
    type CreateBusCallback = BusListProps["createBusCallback"];


    export interface BusListTypeSepProps {
        buses: Buses,

        creatable: {
            editing: Editing,
            showCreate: ShowCreate,
        },
        create: {
            createBusCallback: CreateBusCallback
        },

        display: {
            editing: Editing,
            isStarredList: IsStarredList,
        },

        busFactoryProps: {
            editing: Editing,
            editFreeze: EditFreeze,
            eventTarget: EventTarget,
            starCallback: StarCallback,
            starredBusIDs: StarredBusIDs,
            saveBoardingAreaCallback: SaveBoardingAreaCallback,
        },
    };
}
type BusListTypeSepProps = __BusListTypeSepPropsNamespace.BusListTypeSepProps;

const BusComponentWrapperFactory = ({
    editing,
    editFreeze,
    eventTarget,
    starCallback,
    starredBusIDs,
    saveBoardingAreaCallback,
}: BusListTypeSepProps["busFactoryProps"]) => function BusComponentWrapper(bus: Readonly<GetSchoolAndPerms_school_buses>) {
    return (
        <Bus
            key={bus.id}
                    
            bus={bus}
            
            editing={editing}
            editFreeze={editFreeze}
            eventTarget={eventTarget}
            
            starCallback={(event) => starCallback(bus.id, event)}
            isStarred={starredBusIDs.has(bus.id)}
            
            saveBoardingAreaCallback={saveBoardingAreaCallback?.(bus.id)}
            size={editing ? BusComponentSizes.COMPACT : BusComponentSizes.NORMAL}
        />
    );
};

const propTypeSep = (props: BusListProps): BusListTypeSepProps => {
    const {
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
    } = props;

    return {
        buses,
        
        creatable: { editing, showCreate },
        create: { createBusCallback },
        
        display: { editing, isStarredList },

        busFactoryProps: {
            editing,
            editFreeze,
            eventTarget,
            starCallback,
            starredBusIDs,
            saveBoardingAreaCallback,
        },
    };
};

const BusList: React.FC<BusListProps> = props => {
    const {
        buses,
        creatable, create,
        display,
        busFactoryProps,
    } = propTypeSep(props);

    const showCreateButton = creatable.showCreate && creatable.editing?.bus.create;

    const busComponentBuilder = useMemoizedBuilder(BusComponentWrapperFactory, busFactoryProps);

    const busListContents = useMemoMap(buses, busComponentBuilder);

    return (
        <div className={busContContBldr.IF(display.isStarredList).busContStarCont()}>
            <div className={busContBldr.IF(display.editing).busContCompact()}>
                {busListContents}
                {showCreateButton && <CreateBus callback={create.createBusCallback}/>}
            </div>
        </div>
    );
};

export default BusList;
