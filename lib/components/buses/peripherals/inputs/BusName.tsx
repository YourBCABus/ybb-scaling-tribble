import { BusComponentSizes } from "../../Bus";

import { blurOn } from "lib/utils/commonCallbacks";

import { CamelCase } from "lib/utils/style/styleProxy";
import styles from 'styles/components/buses/Peripherals.module.scss';
import BusNameInput, { BusNameInputInterface } from "./BusNameInput";
import { ReadonlyEditField, SavableEditField } from "lib/utils/hooks/useSavableEditField";
const [classes] = CamelCase.wrapCamelCase(styles);

export interface BusNameInterface {
    size: BusComponentSizes;
    name: SavableEditField<string, void> | ReadonlyEditField<string>;
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

