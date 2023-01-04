// Components


// Hooks

import useConfirm from "@hooks/useConfirm";
import usePhoneNumbers from "@hooks/usePhoneNumbers";

// Types
import { FC, useCallback } from "react";
import { SaveNumbersCallback } from "@hooks/usePhoneNumbers";

// Styles
import styles from "@component-styles/phone/Phone.module.scss";
import { CamelCase } from "@camel-case";
const [style] = CamelCase.wrapCamelCase(styles);

// Utils
import NumberDisplay from "./NumberDisplay";
import DeletePhoneNumberSimpleModal from "../modals/DeletePhoneNumberSimpleModal";
import NumberInput from "./NumberInput";
import { PhoneNumber } from "@utils/general/phonenumbers";


interface PhoneNumProps {
    phones: string[];
    editing: boolean;

    updatePhoneNumbers: (newData: string[]) => Promise<void>;
}



const PhoneNum: FC<PhoneNumProps> = ({ phones, editing, updatePhoneNumbers }) => {
    const deleteCallback = useCallback<SaveNumbersCallback>(
        ({ graphData }) => updatePhoneNumbers(graphData),
        [updatePhoneNumbers],
    );
    const addPhoneNumberCallback = useCallback(
        (newNumber: string | undefined) => {
            if (!newNumber) return Promise.resolve();
            return updatePhoneNumbers([...phones, newNumber]);
        },
        [updatePhoneNumbers, phones],
    );
    const deleteConfirm = useConfirm(deleteCallback, true);
    const phoneNumbers = usePhoneNumbers(phones, deleteConfirm.request);


    return (
        <div className={style.outerContainer}>
            <h3 className={style.phoneNumHeader}>Phone Numbers</h3>

            <ul className={style.phoneNumList}>
                {
                    phoneNumbers.map(({number, callback}, index) => (
                        <li key={index}><p className={style.phoneNumListItem}>
                                Call {<NumberDisplay editing={editing} number={number} deleteCallback={callback}/>}
                        </p></li>
                    ))
                }
            </ul>
            <NumberInput visible={editing} addNumber={num => addPhoneNumberCallback(PhoneNumber.tryFormat(num))}/>
            {/*
            {
                (editMode && bus.phone.length !== 0) && <Collapsible className={`${styles.extra_phone_numbers_closed} ${styles.extra_phone_numbers_always}`} openedClassName={styles.extra_phone_numbers_always} trigger={<div>Click for raw phone numbers... <FontAwesomeIcon icon={faAngleUp}/></div>} transitionTime={100}>
                    {
                        bus.phone.map(
                            (phone_string, index) => <div className={styles.with_trash_can} key={index}>
                                <p>{phone_string}</p>{editMode && <FontAwesomeIcon icon={faTrash} onClick={() => setDeletingPhoneNumber({
                                    deletingSingleNum: false,
                                    index,
                                })}/>}
                            </div>
                        )
                    }
                </Collapsible>
            } */}
            <DeletePhoneNumberSimpleModal
                data={deleteConfirm.confirming ? {
                    ...deleteConfirm.data[0],
                    confirm: deleteConfirm.confirm,
                    cancel: deleteConfirm.cancel,
                } : undefined}/>
        </div>
    );
};

export default PhoneNum;
