import { useEffect, useRef, useState } from "react";

import styles from "../styles/UnassignedBoardingAreas.module.scss";
import { GetSchoolAndPerms_school_buses } from "../__generated__/GetSchoolAndPerms";
import getBoardingArea from "./boardingAreas";
import NoSSRComponent from "./noSSRComponent";

function BoardingArea({area, eventTarget, relativePosition}: {area: string, eventTarget: EventTarget, relativePosition: {x: number, y: number}}) {
    const drag = useRef<HTMLSpanElement>(null);
    const [position, setPosition] = useState<{x: number, y: number} | null>(null);
    const [hoveredBus, setHoveredBus] = useState<string | null>(null);

    useEffect(() => {
        const el = drag.current;

        const mouseStart = (event: MouseEvent) => {
            setPosition({x: event.clientX, y: event.clientY});
            event.stopPropagation();
            event.preventDefault();
        };

        const touchStart = (event: TouchEvent) => {
            setPosition({x: event.touches[0].clientX, y: event.touches[0].clientY});
            event.stopPropagation();
            event.preventDefault();
        };

        el?.addEventListener("mousedown", mouseStart);
        el?.addEventListener("touchstart", touchStart);
        
        const mouseMove = (event: MouseEvent) => {
            setPosition(p => p && {x: event.clientX, y: event.clientY});
            event.stopPropagation();
            event.preventDefault();
        };

        const touchMove = (event: TouchEvent) => {
            setPosition(p => p && {x: event.touches[0].clientX, y: event.touches[0].clientY});
            event.stopPropagation();
            event.preventDefault();
        }; 

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("touchmove", touchMove);

        const end = () => {
            setHoveredBus(bus => {
                eventTarget.dispatchEvent(new CustomEvent(`drop:${bus}`, {detail: {boardingArea: area}}));
                return bus;
            });
            setPosition(null);
        };

        const mouseEnd = (event: MouseEvent) => {
            end();
        };
        
        const touchEnd = (event: TouchEvent) => {
            end();
        };

        document.addEventListener("mouseup", mouseEnd);
        document.addEventListener("touchend", touchEnd);

        return () => {
            el?.removeEventListener("mousedown", mouseStart);
            el?.removeEventListener("touchstart", touchStart);
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("touchmove", touchMove);
            document.removeEventListener("mouseup", mouseEnd);
            document.removeEventListener("touchend", touchEnd);
        };
    }, [area, eventTarget]);

    useEffect(() => {
        if (position) {
            const elements = document.elementsFromPoint(position.x, position.y).filter(el => el instanceof HTMLElement) as HTMLElement[];
            const busEl = elements.find(el => el.dataset.bus);
            if (busEl) {
                if (hoveredBus !== busEl.dataset.bus) {
                    if (hoveredBus) {
                        eventTarget.dispatchEvent(new CustomEvent(`leave:${hoveredBus}`));
                    }
                    eventTarget.dispatchEvent(new CustomEvent(`hover:${busEl.dataset.bus}`));
                }
                setHoveredBus(busEl.dataset.bus || null);
            } else {
                if (hoveredBus) {
                    eventTarget.dispatchEvent(new CustomEvent(`leave:${hoveredBus}`));
                }
                setHoveredBus(null);
            }
        } else {
            if (hoveredBus) {
                eventTarget.dispatchEvent(new CustomEvent(`leave:${hoveredBus}`));
            }
            setHoveredBus(null);
        }
    }, [position, eventTarget,  hoveredBus]);

    return <div>
        <span className={styles.boarding_area} ref={drag}>{area}</span>
        {position && <span className={styles.boarding_area} style={{
            opacity: 0.4,
            position: "absolute",
            left: position.x - drag.current!.clientWidth / 2 - relativePosition.x,
            top: position.y - drag.current!.clientHeight / 2 - relativePosition.y,
            width: drag.current!.clientWidth,
            height: drag.current!.clientHeight,
            pointerEvents: "none",
        }}>{area}</span>}
    </div>;
}

interface UnassignedBoardingAreasProps {
    boardingAreas: readonly {name: string}[];
    buses: readonly GetSchoolAndPerms_school_buses[];
    eventTarget: EventTarget;
    relativePosition: {x: number, y: number};
}

export default function UnassignedBoardingAreas({boardingAreas, buses, eventTarget, relativePosition}: UnassignedBoardingAreasProps) {
    const assignedAreas = new Set(buses.map(b => getBoardingArea(b.boardingArea, b.invalidateTime)));
    const unassignedAreas = boardingAreas.map(b => b.name).filter(a => !assignedAreas.has(a)).sort();

    return (
        <NoSSRComponent>
            <h3>Unassigned Boarding Areas</h3>
            <div className={styles.boarding_area_grid}>
                {unassignedAreas.map(area => <BoardingArea key={area} area={area} eventTarget={eventTarget} relativePosition={relativePosition}/>)}
            </div>
        </NoSSRComponent>
    );
};
