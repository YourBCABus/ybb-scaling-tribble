// Components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Hooks


// Types
import { PhoneNumber } from "@utils/general/phonenumbers";
import { FC } from "react";


// Styles
import styles from "@component-styles/phone/Peripherals.module.scss";
import { CamelCase } from "@camel-case";
const [style, builder] = CamelCase.wrapCamelCase(styles);


// Utils
import { faPhone, faTrash } from "@fortawesome/free-solid-svg-icons";


interface NumberDisplayProps {
    editing: boolean;
    number: PhoneNumber;
    deleteCallback: () => void;
}


const NumberDisplay: FC<NumberDisplayProps> = (
    { editing, number, deleteCallback }
) => editing
    ? <span className={style.phoneNumberContainer}>
        <strong className={style.editableItem}>{number.format}</strong>
        <FontAwesomeIcon icon={faTrash} onClick={deleteCallback} className={style.trashIcon}/>
    </span>
    : <a href={number.href} className={builder.phoneNumberContainer.phoneNumberLink()}>{number.format}{' '}
        <FontAwesomeIcon icon={faPhone} className={style.phoneIcon}/>
    </a>;

export default NumberDisplay;
