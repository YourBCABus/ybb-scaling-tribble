// Components
import ReactModal from "react-modal";

// Hooks


// Types

import { PhoneNumber } from "@utils/general/phonenumbers";
import { FC, useCallback, useState } from "react";


// Styles
import { CamelCase } from "lib/utils/style/styleproxy";
import styles from "styles/components/modals/common.module.scss";
import { Change } from "@utils/hooks/meta/usePhoneNumbers";
const [style, builder] = CamelCase.wrapCamelCase(styles);


// Utils


interface DeletePhoneNumberSimpleModalProps {
    data?: {
        change: Change;
        number: PhoneNumber;
        confirm: () => Promise<unknown>;
        cancel: () => Promise<unknown>;
    } | undefined;
}


const DeletePhoneNumberSimpleModal: FC<DeletePhoneNumberSimpleModalProps> = (
    { data }
) => {
    const [isRemoving, setRemoving] = useState(false);

    const confirmCallback = useCallback(() => {
        if (!data) return;
        setRemoving(true);
        data.confirm().then(() => setRemoving(false));
    }, [setRemoving, data]);

    if (!data) return <></>;
    const { number, cancel } = data;

    return <ReactModal isOpen={true} className={builder.modalBase.modalFlexDefault()} style={{
        content: {
            width: "80%",
            maxWidth: "400px",
            height: "200px",
        }}}>
        <h3 className={style.modalTitle}>
            Are you sure you want to remove the phone number {number.format} from this bus?
        </h3>

        <div className={style.modalButtons}>
            <button className={style.modalCancel} onClick={cancel} disabled={isRemoving}>Cancel</button>
            <button
                className={style.modalConfirm}
                onClick={confirmCallback}
                disabled={isRemoving}>
                { isRemoving ? "Removing..." : "Remove"}
            </button>
        </div>
    </ReactModal>;
};

export default DeletePhoneNumberSimpleModal;
