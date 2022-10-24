export const backgroundDivColorChooserFunction = (available: boolean, boardingAreaText: string) => {
    if (!available) return  {backgroundColor: "#f9aeae"};
    else if (boardingAreaText === "?") return {};
    else if (boardingAreaText === "") return {};
    else return {color: "#e8edec", backgroundColor: "#00796b"};
};
    
const busBoardingAreaBackgroundDivStyle = (
    available: boolean,
    boardingAreaText: string,
    busViewBoardingAreaFont: string,
    busBoardingAreaFontSize: number,
) => ({
    ...backgroundDivColorChooserFunction(available, boardingAreaText),
    font: busViewBoardingAreaFont,
    fontSize: `${busBoardingAreaFontSize}px`,
});

export default busBoardingAreaBackgroundDivStyle;
