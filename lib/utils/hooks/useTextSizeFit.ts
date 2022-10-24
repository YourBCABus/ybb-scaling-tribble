import { useEffect, useState } from "react";

export const measureTextWidth = (text: string, font: string, size: number): number => {
    if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        
        const context = canvas.getContext("2d");
        if (!context) return 0;

        context.font = `${size}px ${font}`;
        const width = context.measureText(text).width;
    
        canvas.remove();
        
        return width;
    } else return 0;
};

export const textSizeToFitContainer = (text: string, font: string, containerWidth: number): number => {
    const resolution = 5;

    let currNumber = 100;

    for (let i = 0; i < resolution; i++) currNumber = containerWidth / measureTextWidth(text, font, currNumber) * currNumber;

    return currNumber;
};

const useTextSizeFit = (text: string, width: number, maxFontSize: number, font: string) => {
    const [fontSize, setFontSize] = useState(maxFontSize);
    useEffect(() => {
        setFontSize(
            Math.floor(
                Math.min(
                    textSizeToFitContainer(text, font, width),
                    maxFontSize,
                )
            )
        );
    }, [text, width, maxFontSize, font]);
    return fontSize;
};

export default useTextSizeFit;
