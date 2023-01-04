import React from "react";
import permParseFunc from "lib/utils/general/perms";
import Bus, { BusComponentSizes } from "./Bus";

import styles from 'styles/components/buses/BusList.module.scss';
import CreateBus from "./CreateBus";
import { CamelCase } from "lib/utils/style/styleproxy";
import useMemoMap from "lib/utils/hooks/useMemoMap";
import useMemoizedBuilder from "lib/utils/hooks/useMemoizedBuilder";
import DragDropEventHandler from "@utils/dragdrop";
import { BoardingArea, BusData, BusId } from "@utils/proptypes";

const [, styleBuilder] = CamelCase.wrapCamelCase(styles);

const busContContBldr = styleBuilder.busContCont;
const busContBldr = styleBuilder.busCont;


export interface BusListProps {
    buses: BusData[];
 
    editing?: ReturnType<typeof permParseFunc>;
    editFreeze: boolean;
    dragDropHandler: DragDropEventHandler;

    isStarredList: boolean;
    starredBusIDs: Set<string>;
    starCallback: (id: BusId, event: Event) => void;

    saveBoardingAreaCallback?: (id: BusId) => (boardingArea: BoardingArea) => Promise<unknown>;

    showCreate: boolean;
    createBusCallback: () => Promise<unknown>;
}


interface BusListTypeSepProps {
    buses: BusListProps["buses"],

    creatable: {
        editing: BusListProps["editing"],
        showCreate: BusListProps["showCreate"],
    },
    create: {
        createBusCallback: BusListProps["createBusCallback"]
    },

    display: {
        editing: BusListProps["editing"],
        isStarredList: BusListProps["isStarredList"],
    },

    busFactoryProps: {
        editing: BusListProps["editing"],
        editFreeze: BusListProps["editFreeze"],
        dragDropHandler: DragDropEventHandler,
        starCallback: BusListProps["starCallback"],
        starredBusIDs: BusListProps["starredBusIDs"],
        saveBoardingAreaCallback: BusListProps["saveBoardingAreaCallback"],
    },
}

const BusComponentWrapperFactory = ({
    editing,
    editFreeze,
    dragDropHandler,
    starCallback,
    starredBusIDs,
    saveBoardingAreaCallback,
}: BusListTypeSepProps["busFactoryProps"]) => function BusComponentWrapper(bus: BusData) {

    return (
        <Bus
            key={bus.id.toString()}
                    
            bus={bus}
            
            editing={editing}
            editFreeze={editFreeze}
            dragDropHandler={dragDropHandler}
            
            starCallback={(event) => starCallback(bus.id, event.nativeEvent)}
            isStarred={starredBusIDs.has(bus.id.toString())}
            
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
        dragDropHandler,
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
            dragDropHandler,
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
