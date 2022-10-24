import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CamelCase } from "lib/utils/style/styleproxy";
import { MouseEventHandler } from "react";

import styles from 'styles/components/buses/Peripherals.module.scss';
const [classes] = CamelCase.wrapCamelCase(styles);

export interface StarIndicatorInterface {
    available: boolean;
    isStarred: boolean;
    starCallback: MouseEventHandler<SVGSVGElement>;
    fontAwesomeIconSizeParam: SizeProp;
}

export default function StarIndicator(
    {
        available, isStarred,
        fontAwesomeIconSizeParam,
        starCallback,
    }: StarIndicatorInterface
): JSX.Element {
    return (
        <FontAwesomeIcon
            icon={faStar}
            className={classes.busStarIndicator}
            style={{color: isStarred && available ? "#00b0ff" : "rgba(0,0,0,.2)"}}
            onClick={available ? starCallback : undefined}
            size={fontAwesomeIconSizeParam} />
    );
}
