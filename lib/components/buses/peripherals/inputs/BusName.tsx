import { EditField } from "lib/utils/hooks/useSavableEditField";

// Style-related imports and setup functions.
import { BusComponentSizes } from "../../Bus";

import { CamelCase } from "lib/utils/style/styleProxy";
import styles from 'styles/components/buses/Peripherals.module.scss';
import BusNameInput from "./BusNameInput";
const [classes] = CamelCase.wrapCamelCase(styles);

export interface BusNameInterface {
    /** 
     * The {@link BusComponentSizes size} for which the parent bus
     * components will be rendered at. For visual reasons, this value
     * should always be the same as the equivalent for the enclosing
     * bus component.
     */
    size: BusComponentSizes;

    /** 
     * The {@link EditField editable field} intended as a bus name
     * target.
     */
    name: EditField<string, void>;

    /**
     * A boolean which indicates whether or not editing is frozen due
     * to a connection issue.
     */
    editFreeze: boolean;
}

export default function BusName({
    size,
    name,
    editFreeze,
}: BusNameInterface): JSX.Element {
    if (name.edit) {
        return <BusNameInput name={name} size={size} editFreeze={editFreeze} />;
    } else {
        return <span className={classes.busName}>{name.value}</span>;
    }
}

