import { BusComponentSizes } from "../../Bus";

import { blurOn, focusOnClick } from "lib/utils/commonCallbacks";

import { CamelCase } from "lib/utils/style/styleProxy";
import styles from 'styles/components/buses/Peripherals.module.scss';
import { SavableEditField } from "lib/utils/hooks/useSavableEditField";
const [, styleBuilder] = CamelCase.wrapCamelCase(styles);

const emptyIf = (value: string, ifPart: string) => value === ifPart ? "" : value;

export interface BusBoardingAreaInputInterface {
    editFreeze: boolean;
    size: BusComponentSizes;
    boardingArea: SavableEditField<string, void>;
}

export default function BusBoardingAreaInput({
    editFreeze,
    size,
    boardingArea,
}: BusBoardingAreaInputInterface): JSX.Element {

    const className = styleBuilder
        .busBoardingAreaInput
        .IF(size === BusComponentSizes.COMPACT).busBoardingAreaInputCompact
        .IF(size === BusComponentSizes.LARGE).busBoardingAreaInputLarge
        .build();

    return <input
        className={className}
        onChange={
            editFreeze
                ? undefined
                : (event) => boardingArea.edit.setTemp(event.currentTarget.value)
        }
        readOnly={editFreeze}
        onBlur={() => boardingArea.edit.save()?.then(boardingArea.edit.clearTemp)}
        value={emptyIf(boardingArea.value, "?")}
        onClick={focusOnClick}
        onKeyDown={blurOn("Enter")}
    />;
}

