import React, { MouseEventHandler, useCallback, useEffect, useMemo, useReducer } from "react";
import { stopAndPrevent } from "lib/utils/general/commonCallbacks";
import { sortDist, useRefWithRerender } from "lib/utils/general/utils";
import useInterval from "./useInterval";

interface DomComponents {
    container: HTMLDivElement | null;
    grip: HTMLDivElement | null;
}

export type SpringTensionCalculator = (shortDist: number, longDist: number) => number;

namespace Actions {
    export enum ActionEnum {
        PHYSICS,
        DRAG_START,
        DRAG_MOVE,
        DRAG_END,
        __SET_POS,
    }
    
    export type Physics = {
        __tag: ActionEnum.PHYSICS;
        domComponents: DomComponents;
        springTensionCalculator: SpringTensionCalculator;
    };
    export const physics = (
        domComponents: DomComponents,
        springTensionCalculator: SpringTensionCalculator,
    ): Physics => ({
        __tag: ActionEnum.PHYSICS,
        domComponents,
        springTensionCalculator,
    });

    export namespace Dragging {
        export type DragStart = {
            __tag: ActionEnum.DRAG_START;
            position: number;
            domComponents: DomComponents;
            springTensionCalculator: SpringTensionCalculator;
        };
        export const dragStart = (
            position: number,
            domComponents: DomComponents,
            springTensionCalculator: SpringTensionCalculator,
        ): DragStart => ({
            __tag: ActionEnum.DRAG_START,
            position,
            domComponents,
            springTensionCalculator,
        });
    
        export type DragMove = {
            __tag: ActionEnum.DRAG_MOVE;
            position: number;
            domComponents: DomComponents;
            springTensionCalculator: SpringTensionCalculator;
            firstTime?: boolean;
        };
        export const dragMove = (
            position: number,
            domComponents: DomComponents,
            springTensionCalculator: SpringTensionCalculator,
        ): DragMove => ({
            __tag: ActionEnum.DRAG_MOVE,
            position,
            domComponents,
            springTensionCalculator,
        });
    
        export type DragEnd = {
            __tag: ActionEnum.DRAG_END;
            domComponents: DomComponents;
            springTensionCalculator: SpringTensionCalculator;
        };
        export const dragEnd = (
            domComponents: DomComponents,
            springTensionCalculator: SpringTensionCalculator,
        ): DragEnd => ({
            __tag: ActionEnum.DRAG_END,
            domComponents,
            springTensionCalculator,
        });
    }
    export type DragActions = Dragging.DragStart | Dragging.DragMove | Dragging.DragEnd;

}

type Action = 
    | Actions.Physics
    | Actions.DragActions
    | { __tag: Actions.ActionEnum.__SET_POS };

namespace StateComponents {
    export enum Target { OPEN, CLOSED }
    export type TargetInfo = { targetEnum: Target, yPos: number };
    
    export type PhysicsState = { position: number, momentum: number };
    
    export type MiscInfo = { prevRawLocation: number, hasBeenMoved: boolean };
    
    export enum Moving { HELD, MOVING, STOPPED }
}

interface DrawerState {
    misc: StateComponents.MiscInfo;
    physics: StateComponents.PhysicsState;
    target: StateComponents.TargetInfo;
    mainState: StateComponents.Moving;
}

const stateActionApplicator = (oldState: DrawerState, action: Action): DrawerState => {
    // {
    //     console.group("oldState");
    //     for (let [key, value] of Object.entries(oldState)) {
    //         console.group(key);
    //         if (value instanceof Object) {
    //             for (let [innerKey, innerVal] of Object.entries(value)) {
    //                 console.log(innerKey, innerVal);
    //             }
    //         } else {
    //             console.log(value);
    //         }
    //         console.groupEnd();
    //     }
    //     console.groupEnd();
    // }


    const { PHYSICS, DRAG_START, DRAG_MOVE, DRAG_END, __SET_POS } = Actions.ActionEnum;
    switch (action.__tag) {
    case DRAG_START: {
        console.log("started");
        const oldHeldState: DrawerState = {
            ...oldState,
            mainState: StateComponents.Moving.HELD,
            misc: {
                prevRawLocation: oldState.physics.position,
                hasBeenMoved: false,
            },
        };
        const moveAction = {
            ...action,
            __tag: Actions.ActionEnum.DRAG_MOVE,
            firstTime: true,
        };
        return stateActionApplicator(oldHeldState, moveAction);
    }
    case DRAG_MOVE: {
        console.log("moved");
        const container = action.domComponents.container;
        const grip = action.domComponents.grip;
        if (container === null || grip === null) return oldState;

        const targetOpen = window.innerHeight - grip.clientHeight;
        const targetClosed = window.innerHeight - (container.clientHeight - grip.clientHeight) - 15;

        const [targetNear, targetFar] = sortDist(targetOpen, targetClosed, action.position);
        const [close, far] = [action.position - targetNear, action.position - targetFar];

        const shouldSetMoved = 
            (!action.firstTime) && 
            (Math.abs(action.position - oldState.misc.prevRawLocation) > 10);

        const hasBeenMoved = oldState.misc.hasBeenMoved || shouldSetMoved;

        if (action.position < targetClosed && action.position > targetOpen) {
            return {
                ...oldState,
                misc: { ...oldState.misc, hasBeenMoved },
                physics: {
                    position: action.position,
                    momentum: action.position - oldState.physics.position,
                },
            };
        } else {
            const actualPos = action.position + action.springTensionCalculator(close, far);
            return {
                ...oldState,
                misc: { ...oldState.misc, hasBeenMoved },
                physics: {
                    position: actualPos,
                    momentum: actualPos - oldState.physics.position,
                },
            };
        }
    }
    case DRAG_END: {
        const {
            CLOSED,
            OPEN,
        } = StateComponents.Target;
        // console.log("ended");

        const container = action.domComponents.container;
        const grip = action.domComponents.grip;
        if (container === null || grip === null) return oldState;

        const targetOpen = window.innerHeight - grip.clientHeight - 15;
        const targetClosed = window.innerHeight - (container.clientHeight - grip.clientHeight);

        if (!oldState.misc.hasBeenMoved) {
            // console.log("run");

            const targetEnum = oldState.target.targetEnum === CLOSED ? OPEN : CLOSED;
            const targetPos = targetEnum === CLOSED ? targetClosed : targetOpen;

            return {
                ...oldState,
                mainState: StateComponents.Moving.MOVING,
                target: {
                    yPos: targetPos,
                    targetEnum: targetEnum,
                },
                physics: {
                    position: oldState.physics.position,
                    momentum: 0,
                },
            };
        }

        const [targetNear] = sortDist(targetOpen, targetClosed, oldState.physics.position);

        return {
            ...oldState,
            mainState: StateComponents.Moving.MOVING,
            target: {
                yPos: targetNear,
                targetEnum: targetNear === targetOpen ? StateComponents.Target.OPEN : StateComponents.Target.CLOSED,
            },
            physics: {
                position: oldState.physics.position,
                momentum: oldState.physics.momentum * 0.1,
            },
        };
    }
    case PHYSICS:
        const physics = doPhysicsStep(
            oldState.target.yPos,
            oldState.physics.position,
            oldState.physics.momentum,
        );

        if (Math.abs(physics.position - oldState.target.yPos) < 1 && Math.abs(physics.momentum) < 0.01) return {
            ...oldState,
            physics,
            mainState: StateComponents.Moving.STOPPED,
        };

        return {
            ...oldState,
            physics,
        };
    
    case __SET_POS:
        return {
            ...oldState,
        };
    }
};

const curryActions = (springTensionCallback: SpringTensionCalculator, domComponents: DomComponents) => ({
    physics: () => Actions.physics(domComponents, springTensionCallback),
    dragging: {
        dragStart: (pos: number) => Actions.Dragging.dragStart(pos, domComponents, springTensionCallback),
        dragMove: (pos: number) => Actions.Dragging.dragMove(pos, domComponents, springTensionCallback),
        dragEnd: () => Actions.Dragging.dragEnd(domComponents, springTensionCallback),
    },
});

const useSpringLocation = (updatesPerSec: number, springTensionCallback: SpringTensionCalculator) => {
    const [container, containerRef] = useRefWithRerender<HTMLDivElement>();
    const [grip, gripRef] = useRefWithRerender<HTMLDivElement>();

    const domComponents: DomComponents = useMemo(() => ({ grip, container }), [grip, container]);
    const refCallbacks = useMemo(() => ({ grip: gripRef, container: containerRef }), [gripRef, containerRef]);

    const {
        physics,
        dragging: { dragStart, dragMove, dragEnd },
    } = useMemo(() => curryActions(springTensionCallback, domComponents), [springTensionCallback, domComponents]);

    const [state, changeState] = useReducer(stateActionApplicator, {
        misc: {
            prevRawLocation: NaN,
            hasBeenMoved: false,
        },
        physics: {
            position: window.innerHeight,
            momentum: 0,
        },
        target: {
            targetEnum: StateComponents.Target.CLOSED,
            yPos: 0,
        },
        mainState: StateComponents.Moving.MOVING,
    });

    const needsRepeatedUpdates = state.mainState === StateComponents.Moving.MOVING;

    useInterval(
        needsRepeatedUpdates ? 1000 / 60 : 0,
        changeState,
        useMemo(physics, [physics]),
    );

    const style: React.CSSProperties = useMemo(
        () => ({
            top: state.physics.position - (domComponents.grip?.clientHeight ?? 0) / 2,
        }),
        [domComponents.grip?.clientHeight, state],
    );

    const isGrabbable = state.mainState !== StateComponents.Moving.HELD;
    useEffect(() => {
        if (isGrabbable && domComponents.grip) {
            const startHandler: (event: MouseEvent) => void = stopAndPrevent(
                (event) => changeState(dragStart(event.clientY))
            );

            domComponents.grip.addEventListener("mousedown", startHandler);
            return () => {
                window.removeEventListener("mousedown", startHandler);
            };
        } else return () => void 0;
    }, [dragStart, domComponents.grip, isGrabbable]);

    const isHeld = state.mainState === StateComponents.Moving.HELD;
    useEffect(() => {
        if (isHeld) {
            const moveHandler = stopAndPrevent(
                (event: MouseEvent) => changeState(dragMove(event.clientY)),
            );
            const endHandler = stopAndPrevent(
                () => changeState(dragEnd()),
            );

            window.addEventListener("mousemove", moveHandler);
            window.addEventListener("mouseup", endHandler);
            return () => {
                window.removeEventListener("mousemove", moveHandler);
                window.removeEventListener("mouseup", endHandler);
            };
        } else return () => void 0;
    }, [dragMove, dragEnd, isHeld]);

    useEffect(() => changeState(dragEnd()), [dragEnd]);

    return useMemo(
        () => ({
            style,
            refs: refCallbacks,
        }),
        [style, refCallbacks],
    );
};

export default useSpringLocation;

const doPhysicsStep = (targetPos: number, currPos: number, momentum: number) => {
    const force = Math.min(Math.pow(Math.abs(targetPos - currPos), 0.5), 5) * (targetPos - currPos);

    let actingMomentum = momentum;

    if (Number.isNaN(actingMomentum)) actingMomentum = 0;

    actingMomentum *= 0.75;
    actingMomentum += force * 0.01;

    const newRawPos = currPos + actingMomentum;

    return {
        position: newRawPos,
        momentum: actingMomentum,
    };
};

