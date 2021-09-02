import styles from '../styles/ConnectionMonitor.module.scss';

import React, { useState, useEffect, useContext, useCallback } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Switch from "react-switch";

import MutationQueueContext from "./mutationQueue";

interface ConnectionMonitorProps {
    editing: boolean;
    setEditFreeze: (state: boolean) => void;
}

enum ConnectionStates {
    GOOD,
    SLOW,
    NONE,
}

const NONE_MESSAGE: [string, string] = [
    "You do not have any network connection.",
    "Editing is disabled.",
];
const SLOW_MESSAGE: [string, string] = [
    "Your network is slow or unresponsive.",
    "By default, this disables editing. To enable editing while the network is slow, turn on the switch. (This setting will persist.)",
];

const shouldFreezeEdit = 
    (connQual: ConnectionStates, slowModeSwitch: boolean) => 
        connQual === ConnectionStates.NONE || (connQual === ConnectionStates.SLOW && !slowModeSwitch);

export async function handleConnQualCallback(setConnQual: (state: ConnectionStates) => void, checkUrl: string, slowModeSwitch: boolean): Promise<boolean> {
    function sleep<T>(ms: number, resolveVal: T) {
        return new Promise<T>(resolve => setTimeout(() => resolve(resolveVal), ms));
    }


    let controller = new AbortController();
    let signal = controller.signal;

    let newQuality = await Promise.race([
        fetch(checkUrl, {signal}).then(() => ConnectionStates.GOOD).catch(() => ConnectionStates.NONE),
        sleep(2900, ConnectionStates.SLOW),
    ]);
    controller.abort();


    setConnQual(newQuality);

    return shouldFreezeEdit(newQuality, slowModeSwitch);
}

export default function ConnectionMonitor(
    {
        editing,
        setEditFreeze,
    }: ConnectionMonitorProps
): JSX.Element {

    const [slowModeSwitch, setSlowModeSwitch] = useState<boolean>(false);
    useEffect(() => {
        setSlowModeSwitch(localStorage.getItem("editingWithSlowNetwork") === "true");
    }, []);
    useEffect(() => {
        localStorage.setItem("editingWithSlowNetwork", slowModeSwitch.toString());
    }, [slowModeSwitch]);

    const mutationQueue = useContext(MutationQueueContext);

    useEffect(
        () => window.addEventListener("beforeunload", (event: BeforeUnloadEvent): string | void => {
            if (mutationQueue.length) {
                event.preventDefault();
                event.returnValue = "If you leave this page, all your unsynced editing data will be lost.";
                return "If you leave this page, all your unsynced editing data will be lost.";
            }
            return;
        }),
        [mutationQueue]
    );

    const [connQual, setConnQual] = useState<ConnectionStates>(ConnectionStates.GOOD);
    const handleConnQual = useCallback(
        () => handleConnQualCallback(setConnQual, "/api/isOnline", slowModeSwitch),
        [setConnQual, slowModeSwitch],
    );
    useEffect(
        () => {
            let interval = setInterval(() => handleConnQual().then((value) => value || mutationQueue.resolvePromise()), 3000);
            return () => clearInterval(interval);
        },
        [handleConnQual, mutationQueue],
    );


    const handleConnQualContext = useContext(HandleConnQualContext);

    useEffect(
        () => { handleConnQualContext.handleConnQual = handleConnQual; },
        [handleConnQualContext, handleConnQual],
    );

    let color: string;
    let warningString: string;
    switch (connQual) {
    case ConnectionStates.NONE:
        color = "#C31A00";
        warningString = NONE_MESSAGE[0] + (editing ? ` ${NONE_MESSAGE[1]}` : "");
        break;

    case ConnectionStates.SLOW:
        color = "#FFCC00";
        warningString = SLOW_MESSAGE[0] + (editing ? ` ${SLOW_MESSAGE[1]}` : "");
        break;

    case ConnectionStates.GOOD:
        color = "#00CC55";
        warningString = "";
        break;
    }

    return (
        <React.Fragment>
            <FontAwesomeIcon
                icon={faExclamationTriangle}
                className={styles.warning_symbol}
                size="4x" style={{
                    color,
                    display:connQual === ConnectionStates.GOOD ? 'none' : undefined,
                }}
            />
            <div className={styles.warning_info}>
                {warningString}
                {
                    editing && connQual === ConnectionStates.SLOW && <React.Fragment>
                        <br/>
                        <Switch
                            className={styles.edit_switch}
                            
                            checked={slowModeSwitch}
                            onChange={setSlowModeSwitch}

                            height={20}
                            width={40}
                        />
                    </React.Fragment>
                }
            </div>
        </React.Fragment>
    );
}

export const HandleConnQualContext: React.Context<{handleConnQual?: () => Promise<boolean>}> = React.createContext({});
