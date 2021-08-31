import '../styles/globals.scss';
import type { AppProps } from 'next/app';

import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

import { Provider } from 'next-auth/client';
import { DefaultSeo } from 'next-seo';

function MyApp({ Component, pageProps }: AppProps) {
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
        <Component {...pageProps} />
    </Provider>;
}
export default MyApp;
