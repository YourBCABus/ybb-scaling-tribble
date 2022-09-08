import { EditField } from "lib/utils/hooks/useSavableEditField";

// Style-related imports and setup functions.
import { BusComponentSizes } from "../../Bus";

import { CamelCase } from "lib/utils/style/styleProxy";
import styles from 'styles/components/buses/Peripherals.module.scss';
import BusBoardingAreaInput from "./BusBoardingAreaInput";
const [classes] = CamelCase.wrapCamelCase(styles);

export interface BusBoardingAreaInterface {
    /** 
     * The {@link BusComponentSizes size} for which the parent bus
     * components will be rendered at. For visual reasons, this value
     * should always be the same as the equivalent for the enclosing
     * bus component.
     */
    size: BusComponentSizes;

    /** 
     * The {@link EditField editable field} intended as a boarding
     * area target.
     */
    boardingArea: EditField<string, void>;

    /**
     * A boolean which indicates whether or not editing is frozen due
     * to a connection issue.
     */
    editFreeze: boolean;
}

/** 
 * @returns A boarding area element, editable or not, depending on
 * the permissions and state of the page.
 */
export default function BusBoardingArea({
    size,
    boardingArea,
    editFreeze,
}: BusBoardingAreaInterface): JSX.Element {
    if (boardingArea.edit) {
        return <BusBoardingAreaInput boardingArea={boardingArea} size={size} editFreeze={editFreeze} />;
    } else {
        return <span className={classes.busName}>{boardingArea.value}</span>;
    }
}

