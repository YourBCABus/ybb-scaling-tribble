import { BusComponentSizes } from "../../Bus";

import { blurOn, focusOnClick } from "lib/utils/general/commonCallbacks";

import { CamelCase } from "lib/utils/style/styleproxy";
import styles from 'styles/components/buses/Peripherals.module.scss';
import { SavableEditField } from "lib/utils/hooks/useSavableEditField";
import { useCallback } from "react";
const [, styleBuilder] = CamelCase.wrapCamelCase(styles);

const emptyIf = (value: string, pred: (orig: string) => boolean) => pred(value) ? "" : value;

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

    const setTemp = useCallback((event) => boardingArea.edit.setTemp(event.currentTarget.value), [boardingArea]);

    return <input
        className={className}
        onChange={
            !editFreeze
                ? setTemp
                : undefined
        }
        readOnly={editFreeze}
        onBlur={() => boardingArea.edit.save()?.then(boardingArea.edit.clearTemp)}
        value={emptyIf(boardingArea.value, name => ["?", ""].includes(name))}
        onClick={focusOnClick}
        onKeyDown={blurOn("Enter")}
    />;
}

