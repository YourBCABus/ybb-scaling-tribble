import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CamelCase } from "lib/utils/style/styleproxy";
import Link from "next/link";

import styles from 'styles/components/buses/Peripherals.module.scss';
const [classes] = CamelCase.wrapCamelCase(styles);

export interface IconInfoLinkInterface {
    id: string;
}

export default function IconInfoLink(
    { id }: IconInfoLinkInterface
): JSX.Element {
    return (
        <Link href="/bus/[busId]" as={`/bus/${id}`}>
            <a className={classes.busInfoButton}>
                <FontAwesomeIcon icon={faInfoCircle} />
            </a>
        </Link>
    );
}
