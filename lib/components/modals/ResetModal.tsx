// Components
import ReactModal from "react-modal";

// Hooks


// Types

import { FC, useCallback, useState } from "react";


// Styles
import { CamelCase } from "lib/utils/style/styleproxy";
import styles from "styles/components/modals/ResetModal.module.scss";
const [style] = CamelCase.wrapCamelCase(styles);

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
        <ReactModal isOpen={showing} style={{
            content: {
                width: "80%",
                maxWidth: "400px",
                height: "200px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            },
        }}>
            <h3 className={styles.resetModalTitle}>Are you sure you want to reset all buses?</h3>
            <button className={style.resetModalCancel} disabled={isResetting} onClick={hide} >Cancel</button>
            <button
                className={style.resetModalConfirm}
                disabled={isResetting}
                onClick={onClickResetCallback}>
                { isResetting ? "Resetting..." : "Reset"}
            </button>
        </ReactModal>
    );
};

export default ResetModal;
