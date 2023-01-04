import styles from 'styles/components/buses/Bus.module.scss';

import { MouseEventHandler, useMemo, useState } from 'react';


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
import DragDropEventHandler from '@utils/dragdrop';
import { BoardingArea, BusData } from '@utils/proptypes';



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
    bus: BusData;

    size?: BusComponentSizes;

    isStarred: boolean;
    starCallback: MouseEventHandler<SVGSVGElement>;

    editing?: BasicPerms;
    editFreeze: boolean;
    dragDropHandler?: DragDropEventHandler;
    noLink?: boolean;

    saveBoardingAreaCallback?: (boardingArea: BoardingArea) => Promise<unknown>;
    saveBusNameCallback?: (busName: string) => Promise<unknown>;
}

const propTypeSep = (props: BusProps) => {
    const { bus, isStarred, starCallback } = props;
    const { editing, editFreeze, dragDropHandler } = props;

    const size = props.size ?? BusComponentSizes.NORMAL;
    const fontAwesomeIconSizeParam = sizeMap[size];

    const { saveBoardingAreaCallback, saveBusNameCallback } = props;
    const updateStatusPerms = editing ? editing.bus.updateStatus : false;
    const updateNamePerms = editing ? editing.bus.update : false;

    const noLink = props.noLink ?? false;

    const output = {
        bus,
        text: {
            name: bus.name,
            boardingArea: bus.boardingArea,
        },
        display: {
            size,
            running: bus.running,
        },
        icon: {
            size,
            noLink,
            info: {
                id: bus.id,
            },
            star: {
                running: bus.running,
                isStarred,
                starCallback,
                fontAwesomeIconSizeParam,
            },
        },
        editing: {
            running: bus.running,
            dragDropHandler,
            editing,
            editFreeze,
            saveBoardingAreaCallback,
            saveBusNameCallback,
            updateStatusPerms,
            updateNamePerms,
        },
    } as const;

    return output;
};

export type BusSepProps = ReturnType<typeof propTypeSep>

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
    
    const rawCallback = editing.saveBoardingAreaCallback;
    const saveBoardingArea = useMemo(
        () => rawCallback && ((areaName: string) => rawCallback(BoardingArea.dummyValid(areaName))),
        [rawCallback],
    );
    const boardingArea = useSavableEditField(text.boardingArea, saveBoardingArea);
    const busName = useSavableEditField(text.name, editing.saveBusNameCallback);


    /**
     * Drag and drop stuff should be 20x as simple now lol.
     */
    const [isHovered, setHovered] = useState<boolean>(false);

    editing.dragDropHandler?.setHoverHandler(bus.id, event => setHovered(event.enabled));

    editing.dragDropHandler?.setCancelHandler(bus.id, () => setHovered(false));

    editing.dragDropHandler?.setConfirmHandler(bus.id, async event => {
        boardingArea.edit?.saveImmediate(event.area.name)?.then(boardingArea.edit.clearTemp);
        setHovered(false);
    });


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
        display.running,
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





