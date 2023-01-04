import { FC, useCallback, useEffect, useRef, useState } from "react";

import styles from "@drawer-styles/UnassignedBoardingAreas.module.scss";

import DragDropEventHandler from "@utils/dragdrop";
import { mouseTouch, stopAndPrevent } from "@utils/general/interaction-currying";
import { BusData, BusId, MappingBoardingArea } from "@utils/proptypes";

interface BoardingAreaProps {
    area: MappingBoardingArea;
    dragDropHandler: DragDropEventHandler;
    relativePosition: {x: number, y: number};
    allowDragging: boolean;
}

type DoIfParams<I, O> = [exec: (input: I) => O, pred: () => boolean];
type DoIfReturn<I, O> = (input: I) => O | undefined;

const BoardingArea: FC<BoardingAreaProps> = ({area, dragDropHandler, relativePosition, allowDragging}) => {
    const drag = useRef<HTMLSpanElement>(null);
    const [position, setPosition] = useState<{x: number, y: number} | null>(null);
    const hasMoved = !!position;
    const [hoveredBus, setHoveredBus] = useState<BusId | null>(null);

    const hover = useCallback(
        (id: BusId) => dragDropHandler.sendHoverEvent({ targetId: id, area, enabled: true }),
        [area, dragDropHandler],
    );
    const leave = useCallback(
        (id: BusId) => dragDropHandler.sendHoverEvent({ targetId: id, area, enabled: false }),
        [area, dragDropHandler],
    );

    useEffect(() => {
        if (allowDragging) {
            const el = drag.current;

            const mouseStart = stopAndPrevent(mouseTouch("mouse")(setPosition));
            const touchStart = stopAndPrevent(mouseTouch("touch")(setPosition));
            el?.addEventListener("mousedown", mouseStart);
            el?.addEventListener("touchstart", touchStart);


            const move = (position: { x: number, y: number }) => setPosition(p => p && position);

            const doIf: <I, O>(...params: DoIfParams<I, O>) => DoIfReturn<I, O> = (exec, pred) => (input) => {
                if (pred()) return exec(input);
                else return undefined;
            };

            const mouseMove = doIf(stopAndPrevent(mouseTouch("mouse")(move)), () => hasMoved);
            const touchMove = doIf(stopAndPrevent(mouseTouch("touch")(move)), () => hasMoved);
            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("touchmove", touchMove);


            const end = () => {
                if (hoveredBus) dragDropHandler.sendDropEvent({ targetId: hoveredBus, area });
                setPosition(null);
            };
            document.addEventListener("mouseup", end);
            document.addEventListener("touchend", end);

            return () => {
                el?.removeEventListener("mousedown", mouseStart);
                el?.removeEventListener("touchstart", touchStart);
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("touchmove", touchMove);
                document.removeEventListener("mouseup", end);
                document.removeEventListener("touchend", end);
            };
        } else {
            if (hoveredBus) leave(hoveredBus);
            setPosition(null);
            setHoveredBus(null);
        }
    }, [area, dragDropHandler, allowDragging, hoveredBus, hasMoved, leave]);

    useEffect(() => {
        if (position) {
            const elements = document.elementsFromPoint(position.x, position.y).filter(el => el instanceof HTMLElement) as HTMLElement[];
            
            const noDrop = (elements: HTMLElement[]) => !!elements.find(el => el.dataset.noDrop);
            const idName = (elements: HTMLElement[]) => elements.find(el => el.dataset.bus)?.dataset.bus;

            const busIdStr = noDrop(elements) ? undefined : idName(elements);
            const busId = busIdStr ? new BusId(busIdStr) : undefined;
            if (busId) {
                if (hoveredBus) {
                    if (!hoveredBus?.eq(busId)) {
                        leave(hoveredBus);
                        hover(busId);
                        setHoveredBus(busId);
                    }
                } else {
                    hover(busId);
                    setHoveredBus(busId);
                }
            } else {
                if (hoveredBus) leave(hoveredBus);
                setHoveredBus(null);
            }
        } else {
            if (hoveredBus) leave(hoveredBus);
            setHoveredBus(null);
        }
    }, [position, hoveredBus, area, hover, leave]);

    const currentDrag = drag.current;

    return <div>
        <span className={allowDragging ? `${styles.boarding_area} ${styles.draggable}` : styles.boarding_area} ref={drag}>{area.name}</span>
        {position && currentDrag && <span className={styles.boarding_area_preview} style={{
            left: position.x - currentDrag.clientWidth / 2 - relativePosition.x,
            top: position.y - currentDrag.clientHeight / 2 - relativePosition.y,
            width: currentDrag.clientWidth,
            height: currentDrag.clientHeight,
        }}>{area.name}</span>}
    </div>;
};

interface UnassignedBoardingAreasProps {
    boardingAreas: MappingBoardingArea[];
    buses: BusData[];
    dragDropHandler: DragDropEventHandler;
    relativePosition: {x: number, y: number};
    allowDragging: boolean;
}

export default function UnassignedBoardingAreas({boardingAreas, buses, allowDragging, ...rest}: UnassignedBoardingAreasProps) {
    const unassignedAreas = MappingBoardingArea.getUnassigned(boardingAreas, buses.map(bus => bus.boardingArea));

    return (
        <div className={styles.unassigned_wrapper} >
            <h3>Unassigned Boarding Areas</h3>
            {allowDragging && <p className={styles.hint_text}>Drag to assign boarding areas to buses.</p>}
            <div className={styles.boarding_area_grid}>
                {unassignedAreas.map(area => <BoardingArea key={area.key} area={area} allowDragging={allowDragging} {...rest} />)}
            </div>
        </div>
    );
}
