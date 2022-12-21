import { EditField } from "lib/utils/hooks/useSavableEditField";

// Style-related imports and setup functions.
import { BusComponentSizes } from "../../Bus";

import { CamelCase } from "lib/utils/style/styleproxy";
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
     * Should this be in edit mode?
     */
    editing: boolean;

    /** 
     * The {@link EditField editable field} intended as a boarding
     * area target.
     */
    boardingArea: EditField<string, unknown>;

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
    editing,
    boardingArea,
    editFreeze,
}: BusBoardingAreaInterface): JSX.Element {
    if (editing && boardingArea.edit) {
        return <BusBoardingAreaInput boardingArea={boardingArea} size={size} editFreeze={editFreeze} />;
    } else {
        return <span className={classes.boardingArea}>{boardingArea.value}</span>;
    }
}

