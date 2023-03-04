import '../styles/globals.scss';
import type { AppProps } from 'next/app';

import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

import { SessionProvider } from 'next-auth/react';
import { NextSeo } from 'next-seo';
import ReactModal from 'react-modal';
import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DrawerTab } from 'lib/components/drawer/Drawer';
import { Session } from 'next-auth';



export interface PageGlobalProps {
    g_eMode: boolean;
    g_eModeSet: (editMode: boolean) => void;
    g_eFreeze: boolean;
    g_eFreezeSet: (editFreeze: boolean) => void;
    g_dTab: DrawerTab;
    g_dTabSet: (drawerTab: DrawerTab) => void;
}

// TODO: Find a better place to put this and use a better element
ReactModal.setAppElement("#__next");


type RootProps = AppProps<Record<string, unknown> & { session: Session } >;

const App: FC<RootProps> = ({ Component, pageProps: { session, ...pageProps } }) => {
    const [g_eMode, g_eModeSet] = useState<boolean>(false);
    const [g_eFreeze, g_eFreezeSet] = useState<boolean>(false);
    const [g_dTab, g_dTabSet] = useState<DrawerTab>(DrawerTab.NOTES);

    const router = useRouter();
    useEffect(() => {
        const handleRouteError = (err: Error) => {
            if (err.message === "Could not connect to the server.") {
                const newErr: Error & { cancelled?: boolean } = new Error("Abort load");
                newErr.cancelled = true;
                throw newErr;
            }
        };

        router.events.on("routeChangeError", handleRouteError);

        return () => {
            router.events.off("routeChangeError", handleRouteError);
        };
    }, [router]);

    const g_eProps: PageGlobalProps = {
        g_eMode, g_eModeSet,
        g_eFreeze, g_eFreezeSet,
        g_dTab, g_dTabSet,    
    };

    return <SessionProvider session={session}>
        <NextSeo
            openGraph={{
                type: "website",
                locale: "en_US",
                url: "https://yourbcabus.com",
                site_name: "YourBCABus",
            }}
            titleTemplate="%s - YourBCABus"
            defaultTitle="YourBCABus" />
        <Component {...pageProps} {...g_eProps} />
    </SessionProvider>;
};

export default App;
