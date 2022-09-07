import { BusComponentSizes } from "../../Bus";

import { CamelCase } from "lib/utils/style/styleProxy";
import styles from 'styles/components/buses/Bus.module.scss';
const [, styleBuilder] = CamelCase.wrapCamelCase(styles);


export interface StatusInterface {
    text: string;
    available: boolean;
    
}

export default function Status({ available, text }: StatusInterface): JSX.Element {
    const statTxtCss = styleBuilder
        .busStatus
        .IF(available).busStatAvail
        .IF(!available).unavailStatus();
    return (
        <span className={statTxtCss}>{text}</span>
    );
}
