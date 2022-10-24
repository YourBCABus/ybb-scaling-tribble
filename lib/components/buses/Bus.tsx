import styles from 'styles/components/buses/Bus.module.scss';

import { MouseEventHandler, useState } from 'react';

import getBoardingArea from "lib/utils/general/boardingAreas";

import { SizeProp } from '@fortawesome/fontawesome-svg-core';

import { BasicPerms } from 'lib/utils/general/perms';
import useTextSizeFit from 'lib/utils/hooks/useTextSizeFit';
import busBoardingAreaBackgroundDivStyle from 'lib/utils/style/forBus';
import { CamelCase } from 'lib/utils/style/styleproxy';
import BusIcon from './peripherals/icon/BusIcon';
import useSavableEditField from 'lib/utils/hooks/useSavableEditField';
import BusBoardingArea from './peripherals/inputs/BusBoardingArea';
import LinkWrapIf from '../other/LinkWrapIf';
import NameAndStatus from './peripherals/macroParts/NameAndStatus';
import mapObject from 'lib/utils/general/propTypeSep';



// const x: InputType<BusProps> =  as const;


export interface BusObj {
    __typename: "Bus";
    id: string;
    name: string | null;
    boardingArea: string | null;
    invalidateTime: string | number | Date | null;
    available: boolean;
}

export enum BusComponentSizes {
    COMPACT = 0,
    NORMAL = 1,
    LARGE = 2,
}


export interface BusProps {
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

const propTypeSep = (props: BusProps) => {
    const data = {
        ...props,
        size: props.size ?? BusComponentSizes.NORMAL,
        fontAwesomeIconSizeParam: sizeMap[props.size ?? BusComponentSizes.NORMAL],
        updateStatusPerms: props.editing ? props.editing.bus.updateStatus : false,
        updateNamePerms: props.editing ? props.editing.bus.update : false,
        noLink: props.noLink ?? false,
    } as const;

    const mapObj = {
        bus: "bus",
        text: {
            name: "bus.name",
            boardingArea: "bus.boardingArea",
            invalidateTime: "bus.invalidateTime",
        },
        display: {
            size: "size",
            available: "bus.available",
        },
        icon: {
            size: "size",
            noLink: "noLink",
            info: {
                id: "bus.id",
            },
            star: {
                available: "bus.available",
                isStarred: "isStarred",
                starCallback: "starCallback",
                fontAwesomeIconSizeParam: "fontAwesomeIconSizeParam",
            },
        },
        editing: {
            available: "bus.available",
            editing: "editing",
            editFreeze: "editFreeze",
            saveBoardingAreaCallback: "saveBoardingAreaCallback",
            saveBusNameCallback: "saveBusNameCallback",
            updateStatusPerms: "updateStatusPerms",
            updateNamePerms: "updateNamePerms",
        },
    } as const;

    return mapObject(data, mapObj);
};

const [, styleBuilder] = CamelCase.wrapCamelCase(styles);

const busViewBoardingAreaFont = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif";

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

    // TODO: fix this.
    const [isHovered] = useState<boolean>(false);

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
            <NameAndStatus {...{
                name: busName,
                boardingAreaText: boardingArea.value,
                sizeClassBuilder: sizeClassBldr,
                display,
                editing,
            }}/>
            <BusIcon {...icon}/>
            <div className={sizeClassBldr.busBoardingAreaBackgroundDiv()} style={boardingAreaBackgroundStyle}>
                <BusBoardingArea
                    editing={!!editing.editing}
                    boardingArea={boardingArea}
                    size={display.size}
                    editFreeze={editing.editFreeze} />
            </div>
        </div>
    );
    return (
        <LinkWrapIf show={!(editing.editing || icon.noLink)} href={`/bus/${bus.id}`}>
            {inner}
        </LinkWrapIf>
    );
}





