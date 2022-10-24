import { signIn, signOut, useSession } from 'next-auth/client';

import Image from 'next/image';
import Link from 'next/link';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import Switch from "react-switch";

import styles from "styles/Navbar.module.scss";

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

export default function NavBar( { editSwitchOptions }: { selectedPage: PagesInNavbar, editSwitchOptions?: EditSwitchOptions } ) {
    const [session, loading] = useSession();

    const spacerRef = useRef<HTMLDivElement>(null);
    const [sideBySide, setSideBySide] = useState(true);

    const ref1 = useRef<HTMLSpanElement>(null);
    const ref2 = useRef<HTMLDivElement>(null);

    const refs: [RefObject<HTMLSpanElement>, RefObject<HTMLDivElement>] = useMemo(() => [ref1, ref2], []);

    useEffect(() => {
        const callback = () => setSideBySide(recalcSideBySide(spacerRef, refs, sideBySide));

        callback();

        window.addEventListener("resize", callback);

        return () => window.removeEventListener("resize", callback);
    }, [spacerRef, refs, sideBySide]);

    const leftPart = <>
        <Link href={"/"} passHref={true}><a>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="YourBCABus Logo" height={32} width={32} />
                <span>YourBCABus</span>
            </div>
        </a></Link>
        <a href="https://about.yourbcabus.com" className={styles.about}>About</a>
        <a href="https://about.yourbcabus.com/support" className={styles.support}>Support</a>
    </>;

    const rightPart = <>
        {
            editSwitchOptions && <span className={styles.edit} ref={refs[0]}>
                <Switch className={styles.edit_switch} checked={editSwitchOptions.state} onChange={editSwitchOptions.onChange} height={20} width={40}/>{" "}
                <span className={styles.edit_text}>Editing mode</span>
            </span>
        }
        {!loading && <div className={styles.auth} ref={refs[1]}>
            {session?.user ?
                <button onClick={() => signOut()} className={styles.sign_out_button}>Sign out</button> :
                <button onClick={() => signIn("yourbcabus")} className={styles.sign_in_button}>Sign in</button>}
        </div>}
    </>;


    return sideBySide
        ? <div className={styles.navbar}>
            {leftPart}

            <div className={styles.spacer} ref={spacerRef}></div>
            {rightPart}
        </div>
        : <>
            <div className={styles.navbar}>
                {leftPart}

                <div className={styles.spacer} ref={spacerRef}></div>
            </div>
            <div className={styles.navbar}>
                {rightPart}
            </div>
        </>;
}

function recalcSideBySide(spacerRef: RefObject<HTMLElement>, refs: RefObject<HTMLElement>[], currentSideBySide: boolean, ) {
    const rightPartWidth = refs.map(ref => ref.current?.offsetWidth ?? 0).reduce((prev, curr) => prev + curr);

    const sideBySideWidth = (spacerRef.current?.clientWidth ?? 10) - (currentSideBySide ? 0 : rightPartWidth);

    return sideBySideWidth > 10;
}
