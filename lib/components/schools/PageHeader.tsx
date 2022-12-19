// Components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavBar, { PagesInNavbar } from "../other/navbar";

// Hooks


// Types

import { SearchFilter } from "lib/utils/hooks/useSearch";
import { FC } from "react";


// Styles
import { CamelCase } from "lib/utils/style/styleproxy";
import styles from "styles/components/schools/SchoolPageHeader.module.scss";
const [style] = CamelCase.wrapCamelCase(styles);

// Utils
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { Immutable } from "lib/utils/general/utils";
import { BusObj } from "../buses/Bus";


interface SchoolPageHeaderProps {
    search: SearchFilter<Immutable<BusObj>>;
    schoolName: string;
    editing: boolean;
    canEdit: boolean;

    setEditing: (mode: boolean) => void;
}


const SchoolPageHeader: FC<SchoolPageHeaderProps> = ({ search, schoolName, editing, setEditing, canEdit }) => (
    <header className={style.header}>
        <NavBar selectedPage={PagesInNavbar.NONE} editSwitchOptions={canEdit ? {state: editing, onChange: () => setEditing(!editing)} : undefined}/>
        <h1 className={style.schoolName}>{schoolName}</h1>
        <div className={style.searchBox}>
            <FontAwesomeIcon className={style.searchIcon} icon={faSearch}></FontAwesomeIcon>
            <input
                className={style.searchInput}
                type="search"
                value={search.term}
                onChange={event => search.setTerm(event.target.value)}
                placeholder="Search for a bus..."
            />
        </div>
    </header>
);

export default SchoolPageHeader;
