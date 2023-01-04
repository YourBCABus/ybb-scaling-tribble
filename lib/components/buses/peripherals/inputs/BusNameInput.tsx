import { BusComponentSizes } from "../../Bus";

import { blurOn, focusOnClick } from "@utils/general/interaction-currying";

import { CamelCase } from "lib/utils/style/styleproxy";
import styles from 'styles/components/buses/Peripherals.module.scss';
import { SavableEditField } from "lib/utils/hooks/useSavableEditField";
const [, styleBuilder] = CamelCase.wrapCamelCase(styles);

export interface BusNameInputInterface {
    editFreeze: boolean;
    size: BusComponentSizes;
    name: SavableEditField<string, unknown>;
}

export default function BusNameInput({
    editFreeze,
    size,
    name,
}: BusNameInputInterface): JSX.Element {
    const className = styleBuilder
        .busName
        .IF(size === BusComponentSizes.COMPACT).busNameCompact
        .IF(size === BusComponentSizes.LARGE).busNameLarge
        .busNameInput();

    return (
        <input
            className={className}
            onChange={
                editFreeze
                    ? undefined
                    : (event) => name.edit.setTemp(event.currentTarget.value)
            }
            readOnly={editFreeze}
            onBlur={() => name.edit.save()?.then(name.edit.clearTemp)}
            value={name.value}
            onClick={focusOnClick}
            onKeyDown={blurOn("Enter")}
        />
    );
}

