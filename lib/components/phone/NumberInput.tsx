// Components


// Hooks
import { useSavableEditField } from "@utils/hooks";
import { KeyboardEvent, useCallback, useState } from "react";

// Types
import { ChangeEvent, FC } from "react";


// Styles
import styles from "@component-styles/phone/Peripherals.module.scss";
import { CamelCase } from "@camel-case";
const [style, builder] = CamelCase.wrapCamelCase(styles);


// Utils
import { validityMatch } from "@utils/general/phonenumbers";
import { focusOnClick } from "@utils/general/interaction-currying";

interface NumberInputProps {
    visible: boolean;
    addNumber: (number: string) => Promise<void>;
}


const isValidPhone = (value: string) => !!value.match(validityMatch);

const NumberInput: FC<NumberInputProps> = ({ visible, addNumber }) => {
    const { value, edit } = useSavableEditField("" as string, addNumber);
    const [ saving, setSaving ] = useState(false);

    const isValid = isValidPhone(value);

    const changeEvent = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => edit?.setTemp(event.currentTarget.value),
        [edit],
    );

    const add = useCallback(
        async () => {
            if (!edit) return;
            if (!isValid) return;

            setSaving(true);
            await edit.save();
            edit.clearTemp();
            setTimeout(() => setSaving(false), 100);
        },
        [edit, isValid],
    );
    const keydown = useCallback(
        async (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                document.querySelectorAll(`button`).forEach(button => {
                    if (button.matches(`.${style.numInputAddButton}`)) button.click();
                });
            }
        },
        [],
    );

    if (visible && edit) {
        return <span className={style.numInputContainer}>
            <input
                placeholder="New Phone Number..."
                className={builder.numberInput.IF(isValid).numberInput()}
                onChange={changeEvent}
                readOnly={saving}
                value={value}
                onClick={focusOnClick}
                onKeyDown={keydown} />
            <button className={style.numInputAddButton} onClick={add} disabled={edit.saving || !isValid}>{edit?.saving ? "Adding..." : "Add"}</button>
        </span>;
    } else return <></>;
};

export default NumberInput;
