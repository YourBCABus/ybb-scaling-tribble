import styles from "../styles/Drawer.module.scss";

import React, { useState, useEffect, useRef } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLines } from '@fortawesome/free-solid-svg-icons';
import NoSSRComponent from "./noSSRComponent";

export enum DragUpDrawerXLocation {
    LEFT,
    MIDDLE,
    RIGHT
}

export enum DragUpDrawerYLocation {
    TOP,
    MIDDLE,
    BOTTOM,
}

export enum DragDirection {
    LEFT,
    RIGHT,
    UP,
    DOWN
}

export enum SpringTension {
    HIGH = 1,
    MEDIUM = 0.5,
    LOW = 0.25,
}

interface DragDrawerProps {
    location: {x: DragUpDrawerXLocation, y: DragUpDrawerYLocation},
    direction: DragDirection,
    snapToTension: number,
    overTension: number,
    children?: JSX.Element | JSX.Element[],
    className: string,
}

function calculateSpringTension(rawPosition: number, height: number, amountAbove: number, springTension: number): number {
    const springPoint = height - amountAbove;
    if (rawPosition > springPoint) {
        return springPoint + Math.min(Math.sqrt(rawPosition - springPoint), rawPosition - springPoint);
    } else if (rawPosition < amountAbove) {
        return amountAbove - Math.min(Math.sqrt(amountAbove - rawPosition), amountAbove - rawPosition);
    } else {
        return rawPosition;
    }
}

export default function Drawer(
    {
        location: {x, y},
        direction,
        snapToTension,
        overTension,
        children,
        className,
    }:  DragDrawerProps,
): JSX.Element {
    if (x == DragUpDrawerXLocation.MIDDLE && y == DragUpDrawerYLocation.MIDDLE) throw Error("How the heck are you going to have a pull drawer in the middle of screen?");

    if (direction != DragDirection.UP) throw Error("Unimplimented. :)");

    const refToContainer = useRef<HTMLDivElement>(null);

    const refToGrip = useRef<HTMLDivElement>(null);

    const [position, setPosition] = useState({o: {p: 30}});

    const [dragHeld] = useState({dH: false});

    const [momentum] = useState({m: 0});

    const [dragTimeoutCounter] = useState({currDragReq: -1});



    const [target] = useState({t: 30});

    useEffect(() => {
        const pos = position.o;
        const gripNode = refToGrip.current;

        let oldPos: number;

        const start = (event: [TouchEvent, false] | [MouseEvent, true]) => {
            const pageY = event[1] ? event[0].pageY : event[0].touches[0].pageY;

            dragHeld.dH = true;
            oldPos = pageY;
            event[0].stopPropagation();
            event[0].preventDefault();
        };
        const touchStart = (event: TouchEvent) => start([event, false]);
        const mouseStart = (event: MouseEvent) => start([event, true]);

        const move = (event: [TouchEvent, false] | [MouseEvent, true]) => {
            if (dragHeld.dH) {
                const pageY = event[1] ? event[0].pageY : event[0].touches[0].pageY;
                momentum.m = (oldPos - pageY) * 0.5;
                pos.p = calculateSpringTension(
                    window.innerHeight - pageY + (gripNode?.clientHeight ?? 0) / 2,
                    refToContainer.current?.clientHeight ?? 0,
                    20,
                    overTension,
                );
                setPosition({...position});
                event[0].stopPropagation();
                event[0].preventDefault();
            }
        };
        const touchMove = (event: TouchEvent) => move([event, false]);
        const mouseMove = (event: MouseEvent) => move([event, true]);

        const end = (event: [TouchEvent, false] | [MouseEvent, true]) => {
            target.t = calcNewTarget(refToContainer.current?.clientHeight ?? 0, pos.p, momentum.m);
            dragHeld.dH = false;
        };
        const touchEnd = (event: TouchEvent) => end([event, false]);
        const mouseEnd = (event: MouseEvent) => end([event, true]);

        gripNode?.addEventListener("touchstart", touchStart);
        gripNode?.addEventListener("mousedown",  mouseStart);

        document.addEventListener("touchmove", touchMove);
        document.addEventListener("mousemove", mouseMove);

        document.addEventListener("touchend", touchEnd);
        document.addEventListener("mouseup",  mouseEnd);


        return () => {
            gripNode?.removeEventListener("touchstart", touchStart);
            gripNode?.removeEventListener("mousedown",  mouseStart);

            document.removeEventListener("touchmove", touchMove);
            document.removeEventListener("mousemove", mouseMove);

            document.removeEventListener("touchend", touchEnd);
            document.removeEventListener("mouseup",  mouseEnd);
        };
    }, [overTension, refToContainer.current, refToGrip.current]); // eslint-disable-line

    useEffect(() => {
        const pos = position.o;
        const intervalNum = setInterval(() => {
            if (!dragHeld.dH) {
                const force = (target.t - pos.p) * snapToTension;

                momentum.m += force * 0.04;
                momentum.m *= 0.8;
                
                const newPos = calculateSpringTension(
                    pos.p + momentum.m,
                    refToContainer.current?.clientHeight ?? 0,
                    10,
                    overTension,
                );

                momentum.m = newPos - pos.p;

                pos.p = newPos;

                setPosition({...position});
            }
        }, 1000 / 60);
        return () => clearInterval(intervalNum);
    }, [overTension, snapToTension, refToContainer.current]); // eslint-disable-line
    return <NoSSRComponent>
        <div
            ref={refToContainer}
            className={`${className} ${styles.main_drawer} ${styles.horizontal_right_fixed}`}
            style={{
                top: typeof window === "undefined" ? 0 : window.innerHeight - position.o.p,
            }}
        >
            <div ref={refToGrip} className={styles.drawer_handle_div}><FontAwesomeIcon icon={faGripLines} size="lg"/></div>
            {children}
            <br/>
        </div>
    </NoSSRComponent>;
}

function calcNewTarget(height: number, position: number, momentum: number): number {
    const expectedPeak = position + momentum * 10;
    if (Math.abs(expectedPeak - 30) < Math.abs(expectedPeak - (height - 30))) {
        return 30;
    } else return height - 30;
}

