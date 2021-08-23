import '../styles/globals.scss';
import type { AppProps } from 'next/app';

import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

import { Provider } from 'next-auth/client';

function MyApp({ Component, pageProps }: AppProps) {
    return <Provider session={pageProps.session}>
        <Component {...pageProps} />
    </Provider>;
}
export default MyApp;
