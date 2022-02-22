import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "../styles/Notes.module.scss";

export function Notes({schoolID}: {schoolID: string}) {
    // Save notes in localStorage under each school ID.
    const storageID = `ybb-note-${schoolID}`;
    const [note, setNote] = useState(() => localStorage.getItem(`ybb-note-${schoolID}`) || '');

    // Debounce saveNote to prevent excessive calls.
    const saveNote = useDebouncedCallback((note: string) => {
        localStorage.setItem(storageID, note);
    }, 1000);

    const [scrollY, setScrollY] = useState(0);
    const refToTextarea = useRef<HTMLTextAreaElement>(null);

    // HACK: If we're running on an iOS device and we detect a scroll, blur the textarea to dismiss the keyboard.
    // This is a hack because iOS scrolling behavior is awful when the keyboard is up.
    const [isTextareaFocusedOnLastScrollEvent, setTextareaFocusedOnLastScrollEvent] = useState(false);
    useEffect(() => {
        let isOniOS = false;
        if (window.navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            isOniOS = true;
        } else if (window.navigator.userAgent.match(/Mac/i)) {
            isOniOS = "ontouchend" in document;
        }
        if (typeof window !== 'undefined' && isOniOS) {
            let handler: () => void;
            if (isTextareaFocusedOnLastScrollEvent) {
                handler = () => {
                    refToTextarea.current?.blur();
                };
            } else {
                handler = () => {
                    if (refToTextarea.current === document.activeElement) {
                        setTextareaFocusedOnLastScrollEvent(true);
                    }
                };
            }
            document.addEventListener('scroll', handler);
            return () => document.removeEventListener('scroll', handler);
        }
    }, [isTextareaFocusedOnLastScrollEvent]);

    // Display a textarea for this school's note. Save changes on blur and on change.
    return (<>
        <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        </Head>
        <textarea
            ref={refToTextarea}
            className={styles.notes_text_area}
            style={{backgroundPosition: `0 ${-1 -scrollY}px`}}
            value={note}
            onChange={e => {
                setNote(e.target.value);
                saveNote(e.target.value);
            }}
            onScroll={e => {
                setScrollY(e.currentTarget.scrollTop);
            }}
            onBlur={_ => {
                setTextareaFocusedOnLastScrollEvent(false);
            }}
            placeholder="Enter notes here..." />
    </>
    );
}

