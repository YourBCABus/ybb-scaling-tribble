import { KeyboardEventHandler, MouseEvent as ReactMouseEvent } from "react";

type BlurOnType = (targetString: string) => KeyboardEventHandler<HTMLInputElement>;
export const blurOn: BlurOnType = (targetString) => event => event.key === targetString && event.currentTarget.blur();


export const focusOnClick = <T extends HTMLElement>(event: ReactMouseEvent<T>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
};

export const stopAndPrevent = <E extends Event, O>(callback: (thing: E) => O) => 
    (e: E) => {
        e.stopPropagation();
        e.preventDefault();
        callback(e);
    };

const curryer = {
    "mouse": (
        handler: (e: {x: number, y: number}) => void,
    ) => (
        e: MouseEvent,
    ) => handler(
        { x: e.clientX, y: e.clientY },
    ),
    "touch": (
        handler: (e: {x: number, y: number}) => void
    ) => (
        e: TouchEvent
    ) => handler(
        { x: e.touches.item(0)?.clientX ?? 0, y: e.touches.item(0)?.clientY ?? 0 }
    ),
} as const;

export const mouseTouch = <T extends keyof typeof curryer>(
    wrap: T,
): typeof curryer[T] => curryer[wrap];

