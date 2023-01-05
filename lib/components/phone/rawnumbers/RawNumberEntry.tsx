// Components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


// Hooks


// Types
import { Entry } from "@utils/hooks/meta/usePhoneNumbers";
import { FC } from "react";


// Styles
import styles from "@component-styles/phone/Raw.module.scss";
import { CamelCase } from "@camel-case";
const [style, builder] = CamelCase.wrapCamelCase(styles);


// Utils
import { faTrash } from "@fortawesome/free-solid-svg-icons";


interface RawNumberEntryProps {
    entry: Entry;
}


const RawNumberEntry: FC<RawNumberEntryProps> = ({ entry: { entry, callback } }) => (
    <span className={style.rawEntryContainer}>
        <code className={style.rawEntryData}>{entry.data}</code>
        <FontAwesomeIcon icon={faTrash} onClick={callback} className={style.trashIcon}/>
    </span>
);

export default RawNumberEntry;
