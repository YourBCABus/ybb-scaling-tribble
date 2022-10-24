import { CamelCase } from "lib/utils/style/styleproxy";
import styles from 'styles/components/buses/Bus.module.scss';
const [, styleBuilder] = CamelCase.wrapCamelCase(styles);


export interface StatusInterface {
    boardingAreaText: string;
    available: boolean;
}

const getStatusText = ({
    available,
    boardingAreaText,
}: { available: boolean, boardingAreaText: string }) => {
    if (available) {
        if (boardingAreaText === "?") {
            return "Not on location";
        } else {
            return "On location";
        }
    } else {
        return "De-activated";
    }
};

export default function Status({ available, boardingAreaText }: StatusInterface): JSX.Element {
    const statTxtCss = styleBuilder
        .busStatus
        .IF(available).busStatAvail
        .IF(!available).unavailStatus();
    return (
        <span className={statTxtCss}>{getStatusText({available, boardingAreaText})}</span>
    );
}
