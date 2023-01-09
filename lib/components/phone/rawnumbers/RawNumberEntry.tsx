// Components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


// Hooks


// Types
import { FC } from "react";


// Styles
import styles from "@component-styles/phone/Raw.module.scss";
import { CamelCase } from "@camel-case";
const [style] = CamelCase.wrapCamelCase(styles);


// Utils
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { NumberEntry } from "@utils/general/phonenumbers";


interface RawNumberEntryProps {
    entry: NumberEntry;
    callback?: () => void;
}


const RawNumberEntry: FC<RawNumberEntryProps> = ({ entry, callback }) => (
    <span className={style.rawEntryContainer}>
        <code className={style.rawEntryData}>{entry.data}</code>
        {callback && <FontAwesomeIcon icon={faTrash} onClick={callback} className={style.trashIcon}/>}
    </span>
);

export default RawNumberEntry;
