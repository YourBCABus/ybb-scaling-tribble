import { KeyboardEventHandler, MouseEvent } from "react";

type BlurOnType = (targetString: string) => KeyboardEventHandler<HTMLInputElement>;
export const blurOn: BlurOnType = (targetString) => event => event.key === targetString && event.currentTarget.blur();


export const focusOnClick = (event: MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
};
