// Components
import ReactModal from "react-modal";

// Hooks


// Types

import { NumberEntry } from "@utils/general/phonenumbers";
import { FC, useCallback, useMemo, useState } from "react";


// Styles
import { CamelCase } from "lib/utils/style/styleproxy";
import styles from "styles/components/modals/common.module.scss";
import RawNumberEntry from "@components/phone/rawnumbers/RawNumberEntry";
const [style, builder] = CamelCase.wrapCamelCase(styles);


// Utils


interface DeletePhoneEntryModalProps {
    data?: {
        removed: NumberEntry;
        confirm: () => Promise<unknown>;
        cancel: () => Promise<unknown>;
    } | undefined;
}


const DeletePhoneEntryModal: FC<DeletePhoneEntryModalProps> = (
    { data }
) => {
    const [isRemoving, setRemoving] = useState(false);

    const confirmCallback = useCallback(() => {
        if (!data) return;
        setRemoving(true);
        data.confirm().then(() => setRemoving(false));
    }, [setRemoving, data]);

    const removed = data?.removed;

    const numbers = useMemo(() => {
        if (!removed) return <></>;

        const numbers = removed.numbers;
        if (numbers.length) {
            const optS = numbers.length > 1 ? "s" : "";
            return <p style={{ textAlign: "center", lineHeight: "2rem" }}>
                This will result in the removal of the number{optS}:
                {numbers.map(num => <><br/>{num.format}</>)}
            </p>;
        } else {
            return <p>No valid phone numbers will be removed.</p>;
        }
    }, [removed]);

    if (!data || !removed) return <></>;

    const cancel = data.cancel;

    return <ReactModal isOpen={true} className={builder.modalBase.modalFlexDefault()} style={{
        content: {
            width: "80%",
            maxWidth: "400px",
        }}}>
        <h3 className={style.modalTitle}>
            Are you sure you want to remove the phone entry <RawNumberEntry entry={removed} /> from this bus?

        </h3>
        {numbers}
        <br/>
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

export default DeletePhoneEntryModal;
