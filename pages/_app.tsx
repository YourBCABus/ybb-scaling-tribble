import '../styles/globals.scss';
import type { AppProps } from 'next/app';

import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

import { Provider } from 'next-auth/client';
import { DefaultSeo } from 'next-seo';
import ReactModal from 'react-modal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export enum DrawerTab {
    UNASSIGNED,
    NOTES,
}

export interface EditModeProps {
    editMode: boolean;
    setEditMode: (editMode: boolean) => void;
    editFreeze: boolean;
    setEditFreeze: (editFreeze: boolean) => void;
    drawerTab: DrawerTab;
    setDrawerTab: (drawerTab: DrawerTab) => void;
}

// TODO: Find a better place to put this and use a better element
ReactModal.setAppElement("#__next");

function MyApp({ Component, pageProps }: AppProps) {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [editFreeze, setEditFreeze] = useState<boolean>(false);
    const [drawerTab, setDrawerTab] = useState<DrawerTab>(DrawerTab.UNASSIGNED);

    const router = useRouter();
    useEffect(() => {
        const handleRouteError = (err: any) => {
            if (err.message === "Could not connect to the server.") {
                const newErr: any = new Error("Abort load");
                newErr.cancelled = true;
                throw newErr;
            }
        };

        router.events.on("routeChangeError", handleRouteError);

        return () => {
            router.events.off("routeChangeError", handleRouteError);
        };
    }, [router]);

    return <Provider session={pageProps.session}>
        <DefaultSeo 
            openGraph={{
                type: "website",
                locale: "en_US",
                url: "https://yourbcabus.com",
                site_name: "YourBCABus",
            }}
            titleTemplate="%s - YourBCABus"
            defaultTitle="YourBCABus"
        />
        <Component {...pageProps} editMode={editMode} setEditMode={setEditMode} editFreeze={editFreeze} setEditFreeze={setEditFreeze} drawerTab={drawerTab} setDrawerTab={setDrawerTab} />
    </Provider>;
}
export default MyApp;
