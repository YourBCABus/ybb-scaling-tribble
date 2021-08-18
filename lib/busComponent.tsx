import styles from '../styles/BusComponent.module.scss';

import { MouseEventHandler, ChangeEventHandler, useEffect, useState } from 'react';

import getBoardingArea from "./boardingAreas";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

import Link from "next/link";

export interface BusObj {
    __typename: "Bus";
    id: string;
    name: string | null;
    boardingArea: string | null;
    invalidateTime: any | null;
    available: boolean;
  }

interface BusProps {
    bus: BusObj,
    starCallback: MouseEventHandler<SVGSVGElement>,
    isStarred: boolean, 
    editing: boolean,
    onEdit: ChangeEventHandler<HTMLInputElement>,
    saveCallback: () => void
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

    const resolution = 100;

    let currNumber = 100;

    for (let i = 0; i < resolution; i++) currNumber = containerWidth / measureTextWidth(text, font, currNumber) * currNumber;

    return currNumber;
}


const bus_view_boarding_area_font: string = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif";

export default function Bus({ bus: { name, id, available, boardingArea, invalidateTime }, starCallback, isStarred, editing, onEdit, saveCallback }:  BusProps): JSX.Element {
    let [busBoardingAreaFontSize, setBusBoardingAreaFontSize] = useState<number>(24);
    
    let boardingAreaText = getBoardingArea(boardingArea, invalidateTime);

    useEffect(() => setBusBoardingAreaFontSize(Math.floor(Math.min(textSizeToFitContainer(boardingAreaText, bus_view_boarding_area_font, 50), 24))), [boardingAreaText]);
    
    const inner = <div className={styles.bus_view}>
        <div className={styles.bus_name_and_status}>
            <span className={styles.bus_name}>{name}</span>
            <br/>
            <span className={styles.bus_status}>{available ? (boardingAreaText === "?" ? "Not on location" : "On location") : "Not running"}</span>
        </div>
        <FontAwesomeIcon icon={faStar} className={styles.bus_star_indicator} style={{color: isStarred ? "#00b0ff" : "rgba(0,0,0,.2)"}} onClick={starCallback} size={"lg"}/>
        <div
            className={styles.bus_boarding_area_background_div}
            style={
                {
                    ...(boardingAreaText === "?" ? {} : {color: "#e8edec", backgroundColor: "#00796b"}),
                    font: bus_view_boarding_area_font,
                    fontSize: `${busBoardingAreaFontSize}px`,
                }
            }
        >
            {
                editing
                    ? <input
                        className={styles.bus_boarding_area_input}
                        onChange={onEdit}
                        onBlur={saveCallback}
                        value={getBoardingArea(boardingArea, invalidateTime)}
                        onClick={
                            (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                event.currentTarget.focus();
                            }
                        }
                        onKeyDown={ (event) => event.key === "Enter" && event.currentTarget.blur() }
                    />
                    : getBoardingArea(boardingArea, invalidateTime)
            }
        </div>
        
    </div>;
    
    return editing ? inner : <Link href={`/bus/${id}`} passHref={true}><a>{inner}</a></Link>;
}
