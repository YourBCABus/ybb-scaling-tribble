import styles from 'styles/components/buses/Bus.module.scss';

import { KeyboardEvent, MouseEventHandler, useContext, useEffect, useState } from 'react';

import getBoardingArea from "lib/utils/boardingAreas";

import { SizeProp } from '@fortawesome/fontawesome-svg-core';

import Link from "next/link";

import { BasicPerms } from 'lib/utils/perms';
import useTextSizeFit from 'lib/utils/hooks/useTextSizeFit';
import busBoardingAreaBackgroundDivStyle from 'lib/utils/style/forBus';
import { CamelCase } from 'lib/utils/style/styleProxy';
import BusIcon from './peripherals/icon/BusIcon';
import BusBoardingAreaInput from './peripherals/inputs/BusBoardingAreaInput';
import BusName from './peripherals/inputs/BusName';
import Status from './peripherals/other/Status';
import useSavableEditField from 'lib/utils/hooks/useSavableEditField';

export interface BusObj {
    __typename: "Bus";
    id: string;
    name: string | null;
    boardingArea: string | null;
    invalidateTime: any | null;
    available: boolean;
}

export enum BusComponentSizes {
    COMPACT = 0,
    NORMAL = 1,
    LARGE = 2,
}

interface BusProps {
    bus: BusObj;

    size?: BusComponentSizes;

    isStarred: boolean;
    starCallback: MouseEventHandler<SVGSVGElement>;

    editing?: BasicPerms;
    editFreeze: boolean;
    eventTarget?: EventTarget;
    noLink?: boolean;

    saveBoardingAreaCallback?: (boardingArea: string | null) => Promise<void>;
    saveBusNameCallback?: (busName: string | null) => Promise<void>;
}


namespace __BusListTypeSepPropsNamespace {

    type Bus = BusProps["bus"];
    type IsStarred = BusProps["isStarred"];
    type StarCallback = BusProps["starCallback"];
    type Editing = BusProps["editing"];
    type EditFreeze = BusProps["editFreeze"];
    type EventTarget = BusProps["eventTarget"];
    type NoLink = BusProps["noLink"];
    type SaveBoardingAreaCallback = BusProps["saveBoardingAreaCallback"];
    type SaveBusNameCallback = BusProps["saveBusNameCallback"];


    export interface BusTypeSepProps {
        bus: Bus;

        text: {
            name: Bus["name"];
            boardingArea: Bus["boardingArea"];
            invalidateTime: Bus["invalidateTime"];
        };
        display: {
            size: BusComponentSizes;
            available: Bus["available"];
        };
        icon: {
            size: BusComponentSizes;
            noLink: boolean;
            info: {
                id: Bus["id"];
            };
            star: {
                available: Bus["available"];
                isStarred: IsStarred;
                starCallback: StarCallback;
                fontAwesomeIconSizeParam: SizeProp,
            };
        };
        editing: {
            available: Bus["available"];
            editing: Editing;
            editFreeze: boolean;
            saveBoardingAreaCallback: SaveBoardingAreaCallback;
            saveBusNameCallback: SaveBusNameCallback;
            updateStatusPerms: boolean;
            updateNamePerms: boolean;
        };
    };
}
type BusTypeSepProps = __BusListTypeSepPropsNamespace.BusTypeSepProps;

const propTypeSep = (props: BusProps): BusTypeSepProps => {
    const {
        bus,
        editing,
        editFreeze,
        isStarred,
        noLink,
        starCallback,
        saveBoardingAreaCallback,
        saveBusNameCallback,
        size: sizeOrUndef,
    } = props;

    const size = sizeOrUndef ?? BusComponentSizes.NORMAL;

    const {
        available,

        name,
        boardingArea, invalidateTime,

        id,
    } = bus;

    return {
        bus,
        
        text: {
            name,
            boardingArea, invalidateTime,
        },

        display: {
            available,
            size,
        },

        icon: {
            size: size ?? BusComponentSizes.NORMAL,
            noLink: noLink ?? false,
            info: {
                id,
            },
            star: {
                available,
                isStarred,
                starCallback,
                fontAwesomeIconSizeParam: sizeMap[size ?? BusComponentSizes.NORMAL],
            },
        },

        editing: {
            available,
            editing,
            editFreeze,
            saveBoardingAreaCallback,
            saveBusNameCallback,
            updateStatusPerms: editing ? editing.bus.updateStatus : false,
            updateNamePerms: editing ? editing.bus.update : false,
        },
    };
};

const getStatusText = ({
    available,
    boardingAreaText,
}: { available: boolean, boardingAreaText: string }) => {
    if (available) {
        if (boardingAreaText === "?") {
            return "Not on location";
        } else {
            return "On location";
        }
    } else {
        return "De-activated";
    }
};

const [classes, styleBuilder] = CamelCase.wrapCamelCase(styles);

const stBlBusStat = styleBuilder.busStatus;

const busViewBoardingAreaFont: string = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif";

const sizeMap: Readonly<Record<BusComponentSizes, SizeProp>> = Object.freeze({
    [BusComponentSizes.COMPACT]: "1x",
    [BusComponentSizes.NORMAL]: "lg",
    [BusComponentSizes.LARGE]: "2x",
});

export default function Bus(
    props:  BusProps,
): JSX.Element {
    const {
        bus,
        text,
        display,
        icon,
        editing,
    } = propTypeSep(props);
    
    const savedBoardingAreaText = getBoardingArea(text.boardingArea, text.invalidateTime);
    const boardingArea = useSavableEditField(savedBoardingAreaText, editing.saveBoardingAreaCallback);
    const busName = useSavableEditField(text.name ?? "", editing.saveBusNameCallback);

    const [isHovered, setHovered] = useState<boolean>(false);

    // useEffect(() => {
    //     if (eventTarget) {
    //         const hoverListener = () => {
    //             if (available && saveBoardingAreaCallback) setHovered(true);
    //         };
    
    //         eventTarget.addEventListener(`hover:${id}`, hoverListener);
    
    //         const leaveListener = () => {
    //             setHovered(false);
    //         };
    
    //         eventTarget.addEventListener(`leave:${id}`, leaveListener);
    
    //         const dropListener = (event: Event) => {
    //             if (event instanceof CustomEvent && saveBoardingAreaCallback) {
    //                 const doUpdate = () => {
    //                     setCurrBoardingAreaEdit(event.detail.boardingArea);
    //                     saveBoardingAreaCallback(event.detail.boardingArea).then(() => setCurrBoardingAreaEdit(null));
    //                 };
    //                 if (getBoardingArea(boardingArea, invalidateTime) == "?") {
    //                     doUpdate();
    //                 } else {
    //                     (() => {
    //                         const removeCallbacks = () => {
    //                             eventTarget.removeEventListener("confirm", confirmCallback);
    //                             eventTarget.removeEventListener("cancel", cancelCallback);
    //                         };
    //                         var confirmCallback = () => {
    //                             doUpdate();
    //                             removeCallbacks();
    //                         };
    //                         var cancelCallback = () => {
    //                             removeCallbacks();
    //                         };

    //                         eventTarget.addEventListener("confirm", confirmCallback);
    //                         eventTarget.addEventListener("cancel", cancelCallback);
    //                     })();
    //                     eventTarget.dispatchEvent(new CustomEvent("startConfirm", {detail: {bus, boardingArea: event.detail.boardingArea}}));
    //                 }
    //             }
    //         };
    
    //         eventTarget.addEventListener(`drop:${id}`, dropListener);
    
    //         return () => {
    //             eventTarget.removeEventListener(`hover:${id}`, hoverListener);
    //             eventTarget.removeEventListener(`leave:${id}`, leaveListener);
    //             eventTarget.removeEventListener(`drop:${id}`, dropListener);
    //         };
    //     }
    // }, [eventTarget, id, saveBoardingAreaCallback]);

    const busBoardingAreaFontSize = useTextSizeFit(
        boardingArea.value,
        (display.size === BusComponentSizes.COMPACT) ? 48 : (display.size * 50),
        (display.size === BusComponentSizes.COMPACT) ? 18 : (display.size * 24),
        busViewBoardingAreaFont,
    );

    let boardingAreaBackgroundDivContents: JSX.Element;
    if (!editing.available) {
        boardingAreaBackgroundDivContents = <></>;
    } else if (editing.updateStatusPerms && boardingArea.edit) {
        boardingAreaBackgroundDivContents = (
            <BusBoardingAreaInput
                boardingArea={boardingArea}
                size={display.size}
                editFreeze={editing.editFreeze} />
        );
    } else {
        boardingAreaBackgroundDivContents = <>{boardingArea.value}</>;
    }

    const sizeClassBldr = styleBuilder
        .IF(display.size === BusComponentSizes.COMPACT).sizeCompact
        .IF(display.size === BusComponentSizes.LARGE).sizeLarge;

    const boardingAreaBackgroundStyle = busBoardingAreaBackgroundDivStyle(
        display.available,
        boardingArea.value,
        busViewBoardingAreaFont,
        busBoardingAreaFontSize
    );


    const inner = (
        <div className={sizeClassBldr.IF(isHovered).dndHover.busView()} data-bus={props.editing ? bus.id : undefined}>
            <div className={sizeClassBldr.busNameAndStatus()}>
                <BusName
                    name={busName}
                    editFreeze={editing.editFreeze}
                    size={display.size}/>
                <br/>
                <Status
                    available={display.available}
                    text={getStatusText({ available: display.available, boardingAreaText: boardingArea.value })} />
            </div>
            <BusIcon {...icon}/>
            <div className={sizeClassBldr.busBoardingAreaBackgroundDiv()} style={boardingAreaBackgroundStyle}>{boardingAreaBackgroundDivContents}</div>
        </div>
    );
    
    if (editing.editing || icon.noLink) {
        return inner;
    } else {
        return (
            <Link href={`/bus/${bus.id}`} passHref={true}>
                <a>
                    {inner}
                </a>
            </Link>
        );
    }
}
