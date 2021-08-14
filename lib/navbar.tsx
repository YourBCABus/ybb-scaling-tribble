import Image from 'next/image';
import Link from 'next/link';

import styles from "../styles/Navbar.module.scss";

export enum PagesInNavbar {
    HOME,
    ABOUT,
    SUPPORT
}

export default function NavBar( { selectedPage }: { selectedPage: PagesInNavbar } ) {
    return <div className={styles.navbar}>
        <Link href={"/"} passHref={true}><a>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="YourBCABus Logo" width={40} height={40} />
                <span>YourBCABus</span>
            </div>
        </a></Link>
        <Link href={"/about"} passHref={true}><a className={styles.about}>About</a></Link>
    </div>;
}
