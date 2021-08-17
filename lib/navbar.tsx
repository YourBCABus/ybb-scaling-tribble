import Image from 'next/image';
import Link from 'next/link';
import Switch from "react-switch";

import styles from "../styles/Navbar.module.scss";

export enum PagesInNavbar {
    HOME,
    ABOUT,
    SUPPORT,
    NONE
}

interface EditSwitchOptions {
    state: boolean,
    onChange: (newState: boolean) => void,
}

export default function NavBar( { selectedPage, editSwitchOptions }: { selectedPage: PagesInNavbar, editSwitchOptions?: EditSwitchOptions } ) {
    return <div className={styles.navbar}>
        <Link href={"/"} passHref={true}><a>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="YourBCABus Logo" width={40} height={40} />
                <span>YourBCABus</span>
            </div>
        </a></Link>
        <Link href={"/about"} passHref={true}><a className={styles.about}>About</a></Link>
        {
            editSwitchOptions && <span className={styles.edit}>
                <Switch checked={editSwitchOptions.state} onChange={editSwitchOptions.onChange} height={20} width={40}/>{" "}
                Editing mode
            </span>
        }
    </div>;
}
