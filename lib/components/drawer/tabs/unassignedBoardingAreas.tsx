import { FC, useCallback, useEffect, useRef, useState } from "react";

import styles from "styles/UnassignedBoardingAreas.module.scss";

import { GetSchoolAndPerms_school_buses } from "__generated__/GetSchoolAndPerms";
import getBoardingArea from "lib/utils/general/boardingAreas";
import DragDropEventHandler from "lib/utils/dragdrop/events";

interface BoardingAreaProps {
    area: string;
    dragDropHandler: DragDropEventHandler;
    relativePosition: {x: number, y: number};
    allowDragging: boolean;
}

const BoardingArea: FC<BoardingAreaProps> = ({area, dragDropHandler, relativePosition, allowDragging}) => {
    const drag = useRef<HTMLSpanElement>(null);
    const [position, setPosition] = useState<{x: number, y: number} | null>(null);
    const [hoveredBus, setHoveredBus] = useState<string | null>(null);

    const hover = useCallback(
        (id: string) => dragDropHandler.sendHoverEvent({ targetId: id, areaText: area, enabled: true }),
        [area, dragDropHandler],
    );
    const leave = useCallback(
        (id: string) => dragDropHandler.sendHoverEvent({ targetId: id, areaText: area, enabled: true }),
        [area, dragDropHandler],
    );
    // const leave = useCallback(
    //     (id: string) => 
    // )

    useEffect(() => {
        if (allowDragging) {
            const el = drag.current;

            const mouseStart = (event: MouseEvent) => {
                setPosition({ x: event.clientX, y: event.clientY });
                event.stopPropagation();
                event.preventDefault();
            };

            const touchStart = (event: TouchEvent) => {
                setPosition({ x: event.touches[0].clientX, y: event.touches[0].clientY });
                event.stopPropagation();
                event.preventDefault();
            };

            el?.addEventListener("mousedown", mouseStart);
            el?.addEventListener("touchstart", touchStart);


            const mouseMove = (event: MouseEvent) => {
                setPosition(p => p && { x: event.clientX, y: event.clientY });
                event.stopPropagation();
                event.preventDefault();
            };

            const touchMove = (event: TouchEvent) => {
                setPosition(p => p && { x: event.touches[0].clientX, y: event.touches[0].clientY });
                event.stopPropagation();
                event.preventDefault();
            };

            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("touchmove", touchMove);


            const end = () => {
                if (hoveredBus) dragDropHandler.sendDropEvent({ targetId: hoveredBus, areaText: area });
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
            if (hoveredBus) {
                dragDropHandler.sendHoverEvent({ targetId: hoveredBus, areaText: area, enabled: false });
            }
            setPosition(null);
            setHoveredBus(null);
        }
    }, [area, dragDropHandler, allowDragging, hoveredBus]);

    useEffect(() => {
        if (position) {
            const elements = document.elementsFromPoint(position.x, position.y).filter(el => el instanceof HTMLElement) as HTMLElement[];
            
            const busEl = elements.find(el => el.dataset.noDrop) ? undefined : elements.find(el => el.dataset.bus);
            if (busEl) {
                if (hoveredBus !== busEl.dataset.bus) {
                    if (hoveredBus) leave(hoveredBus);
                    if (busEl.dataset.bus) hover(busEl.dataset.bus);
                }
                setHoveredBus(busEl.dataset.bus || null);
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
        <span className={allowDragging ? `${styles.boarding_area} ${styles.draggable}` : styles.boarding_area} ref={drag}>{area}</span>
        {position && currentDrag && <span className={styles.boarding_area_preview} style={{
            left: position.x - currentDrag.clientWidth / 2 - relativePosition.x,
            top: position.y - currentDrag.clientHeight / 2 - relativePosition.y,
            width: currentDrag.clientWidth,
            height: currentDrag.clientHeight,
        }}>{area}</span>}
    </div>;
};

interface UnassignedBoardingAreasProps {
    boardingAreas: readonly string[];
    buses: readonly GetSchoolAndPerms_school_buses[];
    dragDropHandler: DragDropEventHandler;
    relativePosition: {x: number, y: number};
    allowDragging: boolean;
}

export default function UnassignedBoardingAreas({boardingAreas, buses, allowDragging, ...rest}: UnassignedBoardingAreasProps) {
    const assignedAreas = new Set(buses.map(b => getBoardingArea(b.boardingArea, b.invalidateTime)));
    const unassignedAreas = boardingAreas.filter(a => !assignedAreas.has(a)).sort();

    return (
        <>
            <h3>Unassigned Boarding Areas</h3>
            {allowDragging && <p className={styles.hint_text}>Drag to assign boarding areas to buses.</p>}
            <div className={styles.boarding_area_grid}>
                {unassignedAreas.map(area => <BoardingArea key={area} area={area} allowDragging={allowDragging} {...rest} />)}
            </div>
        </>
    );
}
