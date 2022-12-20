import styles from "styles/Drawer.module.scss";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLines } from '@fortawesome/free-solid-svg-icons';
import NoSSRComponent from "lib/components/other/noSSRComponent";
import useSpringLocation from "lib/utils/hooks/useSpringLocation";

export enum DrawerTab {
    UNASSIGNED,
    NOTES,
}

export type TabFn = (position: { x: number, y: number }) => JSX.Element | JSX.Element[];
export type DrawerTabs = Record<DrawerTab, TabFn>;

export enum SpringTension {
    HIGH = 1,
    MEDIUM = 0.5,
    LOW = 0.25,
}

interface DragDrawerProps {
    snapToTension: number,
    overTension: number,
    tabs: TabFn,
    children: React.ReactElement | React.ReactElement[],
    drawerEventTarget?: EventTarget,
    className: string,
}



export default function Drawer(
    props:  DragDrawerProps,
): JSX.Element {
    const {
        tabs,
        className,
        children,
    } = props;

    const {
        style,
        refs,
        containerPosition,
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
            {tabs(containerPosition)}
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
