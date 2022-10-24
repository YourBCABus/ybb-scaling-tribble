import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CamelCase } from "lib/utils/style/styleproxy";
import { MouseEventHandler } from "react";

import styles from 'styles/components/buses/CreateBus.module.scss';
const [classes] = CamelCase.wrapCamelCase(styles);

export interface CreateBusInterface {
    callback: () => void;
}

export default function CreateBus(
    { callback }: CreateBusInterface
): JSX.Element {
    const linkCallback: MouseEventHandler<HTMLAnchorElement> = event => {
        event.preventDefault();
        callback();
    };

    return (
        <a href="#" className={classes.createBus} onClick={linkCallback}>
            <FontAwesomeIcon icon={faPlus}/>
            Add Bus
        </a>
    );
}
