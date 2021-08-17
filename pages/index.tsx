import { NextSeo } from 'next-seo';
import Image from 'next/image';
import styles from '../styles/Home.module.scss';
import { signIn, signOut, useSession } from 'next-auth/client';
import { useEffect } from 'react';

export default function Home() {
    const [ session ] = useSession();
    useEffect(() => {
        console.log(session);
    }, [session]);

    return (
        <div className={styles.container}>
            <NextSeo title="Home" />

            {!session && <button onClick={() => signIn("yourbcabus")}>Sign in</button>}
            {session && <button onClick={() => signOut()}>Sign out</button>}
        </div>
    );
}
