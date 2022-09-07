import styles from "../styles/Drawer.module.scss";

import React, { useEffect, useReducer, useRef, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLines } from '@fortawesome/free-solid-svg-icons';
import NoSSRComponent from "./noSSRComponent";
import { useRefWithRerender } from "./utils/utils";

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
    children?: (relativePosition: {x: number, y: number}) => JSX.Element | JSX.Element[],
    drawerEventTarget?: EventTarget,
    className: string,
}


enum ActionTypes {
    START_DRAG,
    END_DRAG,
    DRAG_MOVE,
    DO_ANIMATION_STEP,
    SET_TARGET,
}

type NullOrElement = HTMLElement | null;

type DrawerRefs = { container: NullOrElement, grip?: NullOrElement };

type Actions = {
    _tag: ActionTypes.START_DRAG,
    location: number,
    refs: DrawerRefs,
} | {
    _tag: ActionTypes.END_DRAG,
    refs: DrawerRefs,
} | {
    _tag: ActionTypes.DRAG_MOVE,
    location: number,
    refs: DrawerRefs,
} | {
    _tag: ActionTypes.DO_ANIMATION_STEP,
    refs: DrawerRefs,
} | {
    _tag: ActionTypes.SET_TARGET,
    value: number,
};

interface DrawerState {
    prevRawLocation: number;

    position: number;
    momentum: number;

    target: number;

    dragHeld: boolean;
    hasBeenMoved: boolean;
}

const reducer: React.Reducer<DrawerState, { props: DragDrawerProps, action: Actions }> = (prevState: DrawerState, { props, action }: { props: DragDrawerProps, action: Actions }) => {
    const {
        START_DRAG,
        END_DRAG,
        DRAG_MOVE,
        DO_ANIMATION_STEP,
        SET_TARGET,
    } = ActionTypes;
    switch (action._tag) {
    case START_DRAG:
        return {
            prevRawLocation: action.location,

            position: calculateSpringTension(
                window.innerHeight - action.location + (action.refs.grip?.clientHeight ?? 0) / 2,
                action.refs.container?.clientHeight ?? 0,
                20,
                props.overTension,
            ),
            momentum: 0,

            target: NaN,

            dragHeld: true,
            hasBeenMoved: false,
        };

    case END_DRAG: {
        if (prevState.dragHeld) {
            let target: number;
            const bottomTarget = action.refs.grip?.clientHeight ?? 0;
            const height = action.refs.container?.clientHeight ?? 0;

            if (prevState.hasBeenMoved) {
                target = calcNewTarget(height, prevState.position, prevState.momentum, bottomTarget);
            } else {
                // If the user wasn't actively dragging the tray, open/close it
                if (prevState.position > height / 2) {
                    target = calcNewTarget(height, 0, prevState.momentum, bottomTarget);
                } else {
                    target = calcNewTarget(height, height, prevState.momentum, bottomTarget);
                }
            }
            props.drawerEventTarget?.dispatchEvent(new Event(target === bottomTarget ? 'close' : 'open'));

            return {
                ...prevState,
    
                target,
    
                dragHeld: false,
                hasBeenMoved: false,
            };
        } else {
            return prevState;
        }

        
    }

    case DRAG_MOVE:
        if (prevState.dragHeld) {
            props.drawerEventTarget?.dispatchEvent(new Event('move'));
            return {
                prevRawLocation: action.location,
    
                position: calculateSpringTension(
                    window.innerHeight - action.location + (action.refs.grip?.clientHeight ?? 0) / 2,
                    action.refs.container?.clientHeight ?? 0,
                    20,
                    props.overTension,
                ),
                momentum: prevState.prevRawLocation - action.location,
    
                target: NaN,
    
                dragHeld: true,
                hasBeenMoved: prevState.hasBeenMoved || Math.abs(action.location - prevState.prevRawLocation) > 1,
            };
        } else {
            return prevState;
        }

    case DO_ANIMATION_STEP: {
        if (prevState.target) {
            const force = (prevState.target - prevState.position) * props.snapToTension;
    
            let actingMomentum = prevState.momentum;
    
            actingMomentum += force * 0.05;
            actingMomentum *= 0.75;
    
            const newRawPos = prevState.position + actingMomentum;
    
            const newPos = calculateSpringTension(
                newRawPos,
                action.refs.container?.clientHeight ?? 0,
                20,
                props.overTension,
            );
    
            return {
                ...prevState,
                momentum: newPos - prevState.position,
                position: newPos,
            };
        } else {
            return prevState;
        }
    }

    case SET_TARGET:
        return {
            ...prevState,
            target: action.value,
        };
    }
};



export default function Drawer(
    props:  DragDrawerProps,
): JSX.Element {
    const {
        location: {x, y},
        direction,
        children,
        className,
    } = props;

    if (x == DragUpDrawerXLocation.MIDDLE && y == DragUpDrawerYLocation.MIDDLE) throw Error("How the heck are you going to have a pull drawer in the middle of screen?");

    if (direction != DragDirection.UP) throw Error("Unimplimented. :)");

    const [container, containerRef] = useRefWithRerender<HTMLDivElement>();
    const [grip, gripRef] = useRefWithRerender<HTMLDivElement>();

    const [state, stateAction] = useReducer(reducer, {
        prevRawLocation: NaN,

        position: 0,
        momentum: 0,
        target: 0,
        
        dragHeld: false,
        hasBeenMoved: false,
    });

    useEffect(() => {
        const start = (event: [TouchEvent, 'touch'] | [MouseEvent, 'mouse']) => {
            const clientY = event[1] === 'mouse' ? event[0].clientY : event[0].touches[0].clientY;

            stateAction({
                props,
                action: {
                    _tag: ActionTypes.START_DRAG,
                    location: clientY,
                    refs: { container, grip },
                },
            });

            event[0].stopPropagation();
            event[0].preventDefault();
        };
        const touchStart = (event: TouchEvent) => start([event, 'touch']);
        const mouseStart = (event: MouseEvent) => start([event, 'mouse']);

        const move = (event: [TouchEvent, 'touch'] | [MouseEvent, 'mouse']) => {
            const clientY = event[1] === 'mouse' ? event[0].clientY : event[0].touches[0].clientY;

            stateAction({
                props,
                action: {
                    _tag: ActionTypes.DRAG_MOVE,
                    location: clientY,
                    refs: { container, grip },
                },
            });

            event[0].stopPropagation();
            event[0].preventDefault();
        };
        const touchMove = (event: TouchEvent) => move([event, 'touch']);
        const mouseMove = (event: MouseEvent) => move([event, 'mouse']);

        const end = () => {
            stateAction({
                props,
                action: {
                    _tag: ActionTypes.END_DRAG,
                    refs: { container, grip },
                },
            });
        };

        grip?.addEventListener("touchstart", touchStart);
        grip?.addEventListener("mousedown",  mouseStart);

        document.addEventListener("touchmove", touchMove);
        document.addEventListener("mousemove", mouseMove);

        document.addEventListener("touchend", end);
        document.addEventListener("mouseup",  end);

        
        return () => {
            grip?.removeEventListener("touchstart", touchStart);
            grip?.removeEventListener("mousedown",  mouseStart);

            document.removeEventListener("touchmove", touchMove);
            document.removeEventListener("mousemove", mouseMove);

            document.removeEventListener("touchend", end);
            document.removeEventListener("mouseup",  end);
        };
    }, [props, container, grip]);

    useEffect(() => {
        const intervalNum = setInterval(() => {
            stateAction({
                props,
                action: {
                    _tag: ActionTypes.DO_ANIMATION_STEP,
                    refs: { container, grip },
                },
            });
        }, 1000 / 60);
        return () => clearInterval(intervalNum);
    }, [props, container, grip]);

    useEffect(() => {stateAction({
        props,
        action: {
            _tag: ActionTypes.SET_TARGET,
            value: grip?.clientHeight ?? 0,
        },
    });}, [grip]); // eslint-disable-line

    const boundingRect = container?.getBoundingClientRect();

    const screenPosition = {x: boundingRect?.left ?? 0, y: boundingRect?.top ?? 0};

    return <NoSSRComponent>
        <div
            ref={containerRef}
            data-no-drop="true"
            className={`${className} ${styles.main_drawer} ${styles.horizontal_right_fixed}`}
            style={{
                bottom: typeof window === "undefined" ? 0 : state.position - (container?.clientHeight ?? 0),
            }}
        >
            <div ref={gripRef} className={styles.drawer_handle_div}><FontAwesomeIcon icon={faGripLines} size="lg"/></div>
            {children?.(screenPosition)}
            <br/>
        </div>
    </NoSSRComponent>;
}

function calculateSpringTension(rawPosition: number, height: number, amountAbove: number, springTension: number): number {
    const springPoint = height - amountAbove;
    if (rawPosition > springPoint) {
        return springPoint + Math.min(Math.pow(rawPosition - springPoint, 1 / (springTension + 1)), rawPosition - springPoint);
    } else if (rawPosition < amountAbove) {
        return amountAbove - Math.min(Math.pow(amountAbove - rawPosition, 1 / (springTension + 1)), amountAbove - rawPosition);
    } else {
        return rawPosition;
    }
}

function calcNewTarget(height: number, position: number, momentum: number, bottomTarget: number): number {
    const expectedPeak = position + momentum * 10;

    const topTarget = height - bottomTarget;

    if (Math.abs(expectedPeak - bottomTarget) < Math.abs(expectedPeak - topTarget)) {
        return bottomTarget;
    } else return topTarget;
}

