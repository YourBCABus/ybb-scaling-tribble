// Components
import ReactModal from "react-modal";

// Hooks


// Types

import { FC, useCallback, useState } from "react";


// Styles
import { CamelCase } from "lib/utils/style/styleproxy";
import styles from "styles/components/modals/common.module.scss";
const [style, builder] = CamelCase.wrapCamelCase(styles);

// Utils


interface ResetModalProps {
    showing: boolean;
    hide: () => void;

    resetCallback: () => Promise<unknown>;
}


const ResetModal: FC<ResetModalProps> = ({
    showing, hide, resetCallback,
}) => {
    const [isResetting, setIsResetting] = useState(false);

    const onClickResetCallback = useCallback(() => {
        resetCallback().then(() => {
            hide();
            setIsResetting(false);
        });
        setIsResetting(true);
    }, [hide, resetCallback]);

    return (
        <ReactModal isOpen={showing} className={builder.modalBase.modalFlexDefault()} style={{
            content: {
                width: "80%",
                maxWidth: "400px",
                height: "200px",
            },
        }}>
            <h3 className={style.modalTitle}>Are you sure you want to reset all buses?</h3>
            <div className={style.modalButtons}>
                <button className={style.modalCancel} disabled={isResetting} onClick={hide} >Cancel</button>
                <button
                    className={style.modalConfirm}
                    disabled={isResetting}
                    onClick={onClickResetCallback}>
                    { isResetting ? "Resetting..." : "Reset"}
                </button>
            </div>
        </ReactModal>
    );
};

export default ResetModal;
