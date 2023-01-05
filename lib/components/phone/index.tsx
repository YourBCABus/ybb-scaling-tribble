// Components
import NumberInput from "./NumberInput";
import DeletePhoneNumberSimpleModal from "../modals/DeletePhoneNumberSimpleModal";
import NumberDisplay from "./NumberDisplay";

// Hooks
import useConfirm from "@hooks/useConfirm";
import usePhoneNumbers, { RemoveEntryCallback, RemoveNumCallback } from "@utils/hooks/meta/usePhoneNumbers";

// Types
import { FC, useCallback } from "react";
import { PhoneNumber } from "@utils/general/phonenumbers";

// Styles
import styles from "@component-styles/phone/Phone.module.scss";
import { CamelCase } from "@camel-case";
const [style] = CamelCase.wrapCamelCase(styles);

// Utils
import RawPhoneNumbers from "./rawnumbers";


interface PhoneNumProps {
    phoneStrs: string[];
    editing: boolean;

    updatePhoneNumbers: (newData: string[]) => Promise<void>;
}



const PhoneNum: FC<PhoneNumProps> = ({ phoneStrs, editing, updatePhoneNumbers }) => {
    const delNumCall = useCallback<RemoveNumCallback>(
        ({ graphData }) => updatePhoneNumbers(graphData.filter(Boolean)),
        [updatePhoneNumbers],
    );
    const delEntryCall = useCallback<RemoveEntryCallback>(
        ({ graphData }) => updatePhoneNumbers(graphData.filter(Boolean)),
        [updatePhoneNumbers],
    );
    const addPhoneNumberCallback = useCallback(
        (newNumber: string | undefined) => {
            if (!newNumber) return Promise.resolve();
            return updatePhoneNumbers([...phoneStrs, newNumber]);
        },
        [updatePhoneNumbers, phoneStrs],
    );
    const delNumConfirm = useConfirm(delNumCall, true);
    const delEntryConfirm = useConfirm(delEntryCall, true);
    const { phones, raw } = usePhoneNumbers(phoneStrs, delNumConfirm.request, delEntryConfirm.request);


    return (
        <div className={style.outerContainer}>
            <h3 className={style.phoneNumHeader}>Phone Numbers</h3>

            <ul className={style.phoneNumList}>
                {
                    phones.map(({number, callback}, index) => (
                        <li key={index}><p className={style.phoneNumListItem}>
                                Call {<NumberDisplay editing={editing} number={number} deleteCallback={callback}/>}
                        </p></li>
                    ))
                }
            </ul>
            <NumberInput visible={editing} addNumber={num => addPhoneNumberCallback(PhoneNumber.tryFormat(num))}/>
            <RawPhoneNumbers entries={raw} editing={editing}/>
            <DeletePhoneNumberSimpleModal
                data={delNumConfirm.confirming ? {
                    ...delNumConfirm.data[0],
                    confirm: delNumConfirm.confirm,
                    cancel: delNumConfirm.cancel,
                } : undefined}/>
        </div>
    );
};

export default PhoneNum;
