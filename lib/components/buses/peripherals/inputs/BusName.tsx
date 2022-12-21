import { EditField } from "lib/utils/hooks/useSavableEditField";

// Style-related imports and setup functions.
import { BusComponentSizes } from "../../Bus";

import { CamelCase } from "lib/utils/style/styleproxy";
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
     * Should this be in edit mode?
     */
    editing: boolean;

    /** 
     * The {@link EditField editable field} intended as a bus name
     * target.
     */
    name: EditField<string, unknown>;

    /**
     * A boolean which indicates whether or not editing is frozen due
     * to a connection issue.
     */
    editFreeze: boolean;
}

export default function BusName({
    size,
    editing,
    name,
    editFreeze,
}: BusNameInterface): JSX.Element {
    if (editing && name.edit) {
        return <BusNameInput name={name} size={size} editFreeze={editFreeze} />;
    } else {
        return <span className={classes.busName}>{name.value}</span>;
    }
}

