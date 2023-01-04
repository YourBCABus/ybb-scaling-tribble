import React, { useEffect, useMemo, useReducer } from "react";
import { mouseTouch, stopAndPrevent } from "@utils/general/interaction-currying";
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
        __MOVE,
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

    export type Move = {
        __tag: ActionEnum.__MOVE;
        domComponents: DomComponents;
    };

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
    | Actions.Move
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
    const { PHYSICS, DRAG_START, DRAG_MOVE, DRAG_END, __SET_POS, __MOVE } = Actions.ActionEnum;
    
    switch (action.__tag) {
    case DRAG_START: {
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
        } as const;
        return stateActionApplicator(oldHeldState, moveAction);
    }

    case DRAG_MOVE: {
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

        const container = action.domComponents.container;
        const grip = action.domComponents.grip;
        if (container === null || grip === null) return oldState;

        const targetOpen = window.innerHeight - grip.clientHeight - 15;
        const targetClosed = window.innerHeight - (container.clientHeight - grip.clientHeight);

        if (!oldState.misc.hasBeenMoved) {
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

    case PHYSICS: {
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
    }

    case __SET_POS: {
        return {
            ...oldState,
        };
    }

    case __MOVE: {
        const container = action.domComponents.container;
        const grip = action.domComponents.grip;
        if (container === null || grip === null) return oldState;

        const targetOpen = window.innerHeight - grip.clientHeight - 15;
        const targetClosed = window.innerHeight - (container.clientHeight - grip.clientHeight);

        const targetPos = oldState.target.targetEnum === StateComponents.Target.CLOSED ? targetClosed : targetOpen;

        return {
            ...oldState,
            mainState: StateComponents.Moving.MOVING,
            target: {
                yPos: targetPos,
                targetEnum: oldState.target.targetEnum,
            },
        };
    }
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
        needsRepeatedUpdates ? 1000 / updatesPerSec : 0,
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
            const startHandler = ({ y }: { y: number }) => changeState(dragStart(y));
            const mouseStartHandler = stopAndPrevent(mouseTouch("mouse")(startHandler));
            const touchStartHandler = stopAndPrevent(mouseTouch("touch")(startHandler));

            const grip = domComponents.grip;

            grip.addEventListener("mousedown", mouseStartHandler);
            grip.addEventListener("touchstart", touchStartHandler);
            return () => {
                grip.removeEventListener("mousedown", mouseStartHandler);
                grip.removeEventListener("touchstart", touchStartHandler);
            };
        } else return () => void 0;
    }, [dragStart, domComponents.grip, isGrabbable]);

    const isHeld = state.mainState === StateComponents.Moving.HELD;
    useEffect(() => {
        if (isHeld) {
            const moveHandler = ({ y }: { y: number }) => changeState(dragMove(y));
            const mouseMoveHandler = stopAndPrevent(mouseTouch("mouse")(moveHandler));
            const touchMoveHandler = stopAndPrevent(mouseTouch("touch")(moveHandler));

            const endHandler = () => changeState(dragEnd());
            const mouseEndHandler = stopAndPrevent(mouseTouch("mouse")(endHandler));
            const touchEndHandler = stopAndPrevent(mouseTouch("touch")(endHandler));

            window.addEventListener("mousemove", mouseMoveHandler);
            window.addEventListener("touchmove", touchMoveHandler);

            window.addEventListener("mouseup", mouseEndHandler);
            window.addEventListener("touchend", touchEndHandler);
            
            return () => {
                window.removeEventListener("mousemove", mouseMoveHandler);
                window.removeEventListener("touchmove", touchMoveHandler);

                window.removeEventListener("mouseup", mouseEndHandler);
                window.removeEventListener("touchend", touchEndHandler);
            };
        } else return () => void 0;
    }, [dragMove, dragEnd, isHeld]);

    useEffect(() => {
        const listener = () => changeState({ __tag: Actions.ActionEnum.__MOVE, domComponents });
        window.addEventListener("resize", listener);
        return () => window.removeEventListener("resize", listener);
    }, [domComponents]);


    useEffect(() => changeState(dragEnd()), [dragEnd]);

    const y = state.physics.position;
    const x = container?.getBoundingClientRect().left ?? window.innerWidth;

    return useMemo(
        () => ({
            style,
            refs: refCallbacks,
            containerPosition: { x, y },
        }),
        [style, refCallbacks, x, y],
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

