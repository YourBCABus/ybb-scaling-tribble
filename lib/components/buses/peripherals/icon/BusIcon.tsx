import IconInfoLink, { IconInfoLinkInterface } from "./IconInfoLink";
import StarIndicator, { StarIndicatorInterface } from "./StarIndicator";

import { BusComponentSizes } from "../../Bus";


export interface BusIconInterface {
    size: BusComponentSizes,
    noLink: boolean,
    info: IconInfoLinkInterface,
    star: StarIndicatorInterface,
}

export default function BusIcon({
    size, noLink,
    info, star,
}: BusIconInterface): JSX.Element {
    if (size === BusComponentSizes.COMPACT) {
        if (!noLink) {
            return <IconInfoLink {...info} />;
        } else {
            return <></>;
        }
    } else {
        return <StarIndicator {...star}/>;
    }
}