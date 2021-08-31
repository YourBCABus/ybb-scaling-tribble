import '../styles/globals.scss';
import type { AppProps } from 'next/app';

import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

import { Provider } from 'next-auth/client';
import { DefaultSeo } from 'next-seo';
import { useState } from 'react';

export interface EditModeProps {
    editMode: boolean;
    setEditMode: (editMode: boolean) => void;
    editFreeze: boolean;
    setEditFreeze: (editFreeze: boolean) => void;
}

function MyApp({ Component, pageProps }: AppProps) {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [editFreeze, setEditFreeze] = useState<boolean>(false);

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
        <Component {...pageProps} editMode={editMode} setEditMode={setEditMode} editFreeze={editFreeze} setEditFreeze={setEditFreeze} />
    </Provider>;
}
export default MyApp;
