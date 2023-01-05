// Components
import Collapsible from "react-collapsible";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Hooks


// Types
import { FC } from "react";
import { Entry } from "@utils/hooks/meta/usePhoneNumbers";

// Styles
import styles from "@component-styles/phone/Raw.module.scss";
import { CamelCase } from "@camel-case";
const [style, builder] = CamelCase.wrapCamelCase(styles);


// Utils
import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import RawNumberEntry from "./RawNumberEntry";


interface RawPhoneNumbersProps {
    entries: Entry[];
    editing: boolean;
}


const RawPhoneNumbers: FC<RawPhoneNumbersProps> = ({ entries, editing }) => editing ? (
    <Collapsible
        className={builder.rawBuses()}
        openedClassName={builder.rawBuses.open()}
        trigger={<div className={style.collapseTrigger}>View raw phone entries <FontAwesomeIcon icon={faAngleDown} size="lg"/></div>}
        transitionTime={100}>
        <div className={style.dropdownContentContainer}>
            {entries.flatMap((entry, index) => <RawNumberEntry key={index} entry={entry} />)}
        </div>
    </Collapsible>
) : <></>;

export default RawPhoneNumbers;
