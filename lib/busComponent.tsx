import styles from '../styles/BusComponent.module.scss';

import { MouseEventHandler, ChangeEventHandler, useEffect, useState } from 'react';

import getBoardingArea from "./boardingAreas";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';

import Link from "next/link";

import permParseFunc from './perms';

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

    editing: false | ReturnType<typeof permParseFunc>;
    editFreeze: boolean;
    eventTarget?: EventTarget;
    noLink?: boolean;

    saveBoardingAreaCallback?: (boardingArea: string | null) => Promise<void>;
    saveBusNameCallback?: (busName: string | null) => Promise<void>;
}

function measureTextWidth(text: string, font: string, size: number): number {
    if (typeof document !== "undefined") {
        let canvas = document.createElement("canvas");
        
        let context = canvas.getContext("2d")!;
        context.font = `${size}px ${font}`;
        let width = context.measureText(text).width;
    
        canvas.remove();
        
        return width;
    } else return 0;
}

function textSizeToFitContainer(text: string, font: string, containerWidth: number): number {
    const startingFontSizeNumber = 100;

    const resolution = 5;

    let currNumber = 100;

    for (let i = 0; i < resolution; i++) currNumber = containerWidth / measureTextWidth(text, font, currNumber) * currNumber;

    return currNumber;
}


const bus_view_boarding_area_font: string = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif";

export default function Bus(
    {
        bus,
        size = BusComponentSizes.NORMAL,

        isStarred,
        starCallback,
        
        editing,
        editFreeze,
        eventTarget,
        noLink = false,

        saveBoardingAreaCallback,
        saveBusNameCallback,
    }:  BusProps,
): JSX.Element {
    const { name, id, available, boardingArea, invalidateTime } = bus;

    const [busBoardingAreaFontSize, setBusBoardingAreaFontSize] = useState<number>(24);
    
    const [currBoardingAreaEdit, setCurrBoardingAreaEdit] = useState<string | null>(null);
    const [currBoardingAreaEditClearable, setCurrBoardingAreaEditClearable] = useState<boolean>(false);
    // useEffect(
    //     () => {
    //         if (currBoardingAreaEditClearable) {
    //             setCurrBoardingAreaEdit(null);
    //             setCurrBoardingAreaEditClearable(false);
    //         }
    //     },
    //     [bus], //eslint-disable-line
    // );

    const [currBusNameEdit, setCurrBusNameEdit] = useState<string | null>(null);
    const [currBusNameEditClearable, setCurrBusNameEditClearable] = useState<boolean>(false);
    // useEffect(
    //     () => {
    //         if (currBusNameEditClearable) {
    //             setCurrBusNameEdit(null);
    //             setCurrBusNameEditClearable(false);
    //         }
    //     },
    //     [bus], //eslint-disable-line
    // );

    const boardingAreaText = currBoardingAreaEdit ?? getBoardingArea(boardingArea, invalidateTime);
    const busNameText = currBusNameEdit ?? name;

    useEffect(() => {
        const width = (size === BusComponentSizes.COMPACT) ? 48 : (size * 50);
        const maxFontSize = (size === BusComponentSizes.COMPACT) ? 18 : (size * 24);
        setBusBoardingAreaFontSize(Math.floor(Math.min(textSizeToFitContainer(boardingAreaText, bus_view_boarding_area_font, width), maxFontSize)));
    }, [boardingAreaText, size]);

    const [isHovered, setHovered] = useState<boolean>(false);

    useEffect(() => {
        if (eventTarget) {
            const hoverListener = () => {
                setHovered(true);
            };
    
            eventTarget.addEventListener(`hover:${id}`, hoverListener);
    
            const leaveListener = () => {
                setHovered(false);
            };
    
            eventTarget.addEventListener(`leave:${id}`, leaveListener);
    
            const dropListener = (event: Event) => {
                if (event instanceof CustomEvent && saveBoardingAreaCallback) {
                    const doUpdate = () => {
                        setCurrBoardingAreaEdit(event.detail.boardingArea);
                        saveBoardingAreaCallback(event.detail.boardingArea).then(() => setCurrBoardingAreaEdit(null));
                        setCurrBoardingAreaEditClearable(true);
                    };
                    if (getBoardingArea(boardingArea, invalidateTime) == "?") {
                        doUpdate();
                    } else {
                        (() => {
                            const removeCallbacks = () => {
                                eventTarget.removeEventListener("confirm", confirmCallback);
                                eventTarget.removeEventListener("cancel", cancelCallback);
                            };
                            var confirmCallback = () => {
                                doUpdate();
                                removeCallbacks();
                            };
                            var cancelCallback = () => {
                                removeCallbacks();
                            };

                            eventTarget.addEventListener("confirm", confirmCallback);
                            eventTarget.addEventListener("cancel", cancelCallback);
                        })();
                        eventTarget.dispatchEvent(new CustomEvent("startConfirm", {detail: {bus, boardingArea: event.detail.boardingArea}}));
                    }
                }
            };
    
            eventTarget.addEventListener(`drop:${id}`, dropListener);
    
            return () => {
                eventTarget.removeEventListener(`hover:${id}`, hoverListener);
                eventTarget.removeEventListener(`leave:${id}`, leaveListener);
                eventTarget.removeEventListener(`drop:${id}`, dropListener);
            };
        }
    }, [eventTarget, id, saveBoardingAreaCallback]);

    const busBoardingAreaBackgroundDivStyle = {
        ...(boardingAreaText === "?" ? {} : {color: "#e8edec", backgroundColor: "#00796b"}),
        font: bus_view_boarding_area_font,
        fontSize: `${busBoardingAreaFontSize}px`,
    };

    let boardingAreaBackgroundDivContents: JSX.Element | string;
    if (editing && editing.bus.updateStatus && saveBoardingAreaCallback) {
        boardingAreaBackgroundDivContents = <input
            className={styles.bus_boarding_area_input}
            onChange={
                editFreeze
                    ? undefined
                    : (event) => setCurrBoardingAreaEdit(event.currentTarget.value)
            }
            readOnly={editFreeze}
            onBlur={() => { 
                if (currBoardingAreaEdit === null) return;
                saveBoardingAreaCallback(currBoardingAreaEdit).then(() => setCurrBoardingAreaEdit(null));
                setCurrBoardingAreaEditClearable(true);
            }}
            value={boardingAreaText === "?" ? "" : boardingAreaText}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.focus();
            }}
            onKeyDown={ (event) => event.key === "Enter" && event.currentTarget.blur() }
        />;
    } else {
        boardingAreaBackgroundDivContents = boardingAreaText;
    }

    let busNameSpanOrInput: JSX.Element;
    if (editing && editing.bus.update && saveBusNameCallback) {
        busNameSpanOrInput = <input
            className={`${styles.bus_name} ${styles.bus_name_input}`}
            onChange={
                editFreeze
                    ? undefined
                    : (event) => setCurrBusNameEdit(event.currentTarget.value)
            }
            readOnly={editFreeze}
            onBlur={() => {
                if (currBusNameEdit === null) return;
                saveBusNameCallback(currBusNameEdit).then(() => setCurrBusNameEdit(null));
                setCurrBusNameEditClearable(true);
            }}
            value={busNameText ?? ""}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.focus();
            }}
            onKeyDown={ (event) => event.key === "Enter" && event.currentTarget.blur() }
            placeholder="Bus Name"
        />;
    } else {
        busNameSpanOrInput = <span className={styles.bus_name}>{busNameText}</span>;
    }

    let sizeClassName: string;
    let fontAwesomeIconSizeParam: SizeProp;
    switch (size) {
    case BusComponentSizes.COMPACT:
        sizeClassName = ` ${styles.size_compact}`;
        fontAwesomeIconSizeParam = "1x";
        break;

    case BusComponentSizes.NORMAL:
        sizeClassName = ``;
        fontAwesomeIconSizeParam = "lg";
        break;

    case BusComponentSizes.LARGE:
        sizeClassName = ` ${styles.size_large}`;
        fontAwesomeIconSizeParam = "2x";
        break;
    }


    const inner = <div className={`${styles.bus_view}${sizeClassName}${isHovered ? ` ${styles.dnd_hover}` : ""}`} data-bus={editing ? bus.id : undefined}>
        <div className={`${styles.bus_name_and_status}${sizeClassName}`}>
            {busNameSpanOrInput}
            <br/>
            <span className={styles.bus_status}>{available ? (boardingAreaText === "?" ? "Not on location" : "On location") : "Not running"}</span>
        </div>
        {size === BusComponentSizes.COMPACT ?
            !noLink && <Link href="/bus/[busId]" as={`/bus/${id}`}><a className={styles.bus_info_button}><FontAwesomeIcon icon={faInfoCircle} /></a></Link>
            : <FontAwesomeIcon icon={faStar} className={styles.bus_star_indicator} style={{color: isStarred ? "#00b0ff" : "rgba(0,0,0,.2)"}} onClick={starCallback} size={fontAwesomeIconSizeParam}/>}
        <div className={`${styles.bus_boarding_area_background_div}${sizeClassName}`} style={busBoardingAreaBackgroundDivStyle}>{boardingAreaBackgroundDivContents}</div>
        
    </div>;
    
    return editing || noLink ? inner : <Link href={`/bus/${id}`} passHref={true}><a>{inner}</a></Link>;
}
