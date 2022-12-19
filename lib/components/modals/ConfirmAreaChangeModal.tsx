// Components
import ReactModal from "react-modal";
import Bus from "../buses/Bus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Hooks


// Types
import { FC } from "react";
import { BusObj, BusComponentSizes as Size } from "../buses/Bus";


// Styles
import { CamelCase } from "lib/utils/style/styleproxy";
import styles from "styles/components/modals/ConfirmAreaChangeModal.module.scss";
const [style] = CamelCase.wrapCamelCase(styles);

console.log(style);
console.log(style.confirmModalCancel);

// Utils
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";

interface ConfirmAreaChangeModalProps {

    bus?: BusObj;
    newBoardingArea?: string;

    showing: boolean;
    confirm: () => void;
    cancel: () => void;
}


const busBase = {
    isStarred: false,
    starCallback: () => void 0,
    editFreeze: true,
    noLink: true,
    size: Size.COMPACT,
};

const withArea = (bus: BusObj, boardingArea: string): BusObj => ({ ...bus, boardingArea, invalidateTime: Date.now() + 1e6 });

const ConfirmAreaChangeModal: FC<ConfirmAreaChangeModalProps> = ({
    showing, bus, newBoardingArea, confirm, cancel,
}) => (
    <ReactModal isOpen={showing} style={{
        content: {
            width: "80%",
            maxWidth: "400px",
            height: "230px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        },
    }}>
        <h3 className={style.confirmModalTitle}>Are you sure you want to change this bus&#39;s boarding area?</h3>
        
        {bus && <Bus bus={bus} {...busBase}/>}
        <div className={style.downArrowDiv}><FontAwesomeIcon icon={faArrowDown} size="2x"></FontAwesomeIcon></div>
        {bus && <Bus bus={withArea(bus, newBoardingArea ?? "ERR")} {...busBase}/>}

        <br/>
        <button className={style.confirmModalCancel} onClick={cancel}>Cancel</button>
        <button className={style.confirmModalConfirm} onClick={confirm}>Change</button>
    </ReactModal>
);

export default ConfirmAreaChangeModal;
