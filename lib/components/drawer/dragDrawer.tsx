import styles from "styles/Drawer.module.scss";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLines } from '@fortawesome/free-solid-svg-icons';
import NoSSRComponent from "lib/components/other/noSSRComponent";
import useSpringLocation from "lib/utils/hooks/useSpringLocation";

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
    drawerEventTarget?: EventTarget,
    className: string,
}



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

    if (
        direction !== DragDirection.UP ||
        x !== DragUpDrawerXLocation.RIGHT ||
        y !== DragUpDrawerYLocation.BOTTOM
    ) throw Error("Unimplimented. :)");

    const {
        style,
        refs,
    } = useSpringLocation(60, springTensionCalculator);

    return <NoSSRComponent>
        <div
            ref={refs.container}
            data-no-drop="true"
            className={`${className} ${styles.main_drawer} ${styles.horizontal_right_fixed}`}
            style={style}
        >
            <div ref={refs.grip} className={styles.drawer_handle_div}><FontAwesomeIcon icon={faGripLines} size="lg"/></div>
            {children}
        </div>
    </NoSSRComponent>;
}

const springTensionCalculator = (close: number, far: number) => {
    const dist = Math.abs(close - far);

    if (Math.abs(close) < dist && Math.abs(far) < dist) return 0;
    else {
        return asymptoteFn(Math.abs(close), 0.4) * -close;
    }
};

const asymptoteFn = (num: number, tension: number) => num / Math.pow(Math.pow(num, tension) + 1, 1 / tension);
