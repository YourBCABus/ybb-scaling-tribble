import { useSession, signIn, signOut } from 'next-auth/client';

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
    const [session, loading] = useSession();
    return <div className={styles.navbar}>
        <Link href={"/"} passHref={true}><a>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="YourBCABus Logo" height={32} width={32} />
                <span>YourBCABus</span>
            </div>
        </a></Link>
        <a href="https://about.yourbcabus.com" className={styles.about}>About</a>
        <a href="https://about.yourbcabus.com/support" className={styles.support}>Support</a>
        <div className={styles.spacer}></div>
        {
            editSwitchOptions && <span className={styles.edit}>
                <Switch className={styles.edit_switch} checked={editSwitchOptions.state} onChange={editSwitchOptions.onChange} height={20} width={40}/>{" "}
                <span className={styles.edit_text}>Editing mode</span>
            </span>
        }
        {!loading && <div className={styles.auth}>
            {session?.user ?
                <button onClick={() => signOut()} className={styles.sign_out_button}>Sign out</button> :
                <button onClick={() => signIn("yourbcabus")} className={styles.sign_in_button}>Sign in</button>}
        </div>}
    </div>;
}
