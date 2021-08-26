import styles from '../styles/ConnectionMonitor.module.scss';

import { useState, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
interface ConnectionMonitorProps {
    editing: boolean;
    
    editFreeze: boolean;
    setEditFreeze: (state: boolean) => void;

}

enum ConnectionStates {
    GOOD,
    SLOW,
    NONE,
}

async function handleConnQual(setConnQual: (state: ConnectionStates) => void, checkUrl: string) {
    function sleep<T>(ms: number, resolveVal: T) {
        return new Promise<T>(resolve => setTimeout(() => resolve(resolveVal), ms));
    }


    let controller = new AbortController();
    let signal = controller.signal;

    let newQuality = await Promise.any([fetch(checkUrl, {signal}).then(() => ConnectionStates.GOOD).catch(() => ConnectionStates.NONE), sleep(2900, ConnectionStates.SLOW)]);
    controller.abort();


    setConnQual(newQuality);
}

export default function ConnectionMonitor(
    {
        editing,
        editFreeze,
        setEditFreeze,
    }: ConnectionMonitorProps
): JSX.Element {
    let [connQual, setConnQual] = useState<ConnectionStates>(ConnectionStates.GOOD);

    useEffect(
        () => {
            let interval = setInterval(() => handleConnQual(setConnQual, "/api/isOnline"), 3000);
            return () => clearInterval(interval);
        },
        [],
    );

    let color: string;
    switch (connQual) {
    case ConnectionStates.NONE:
        color = "#C31A00";
        break;

    case ConnectionStates.SLOW:
        color = "#FFCC00";
        break;

    case ConnectionStates.GOOD:
        color = "#00CC55";
        break;
    }

    return (
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.warning_symbol} size="4x" style={{color, display: connQual === ConnectionStates.GOOD ? 'none' : undefined}}/>
    );
}
