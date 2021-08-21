export const saveBoardingAreaCallback = 
    (updateServerSidePropsFunction: () => void) => 
        async (id: string, boardingArea: string | null): Promise<void> => {
            if (boardingArea == null) {
                boardingArea = "?";
            }
            await fetch(`/api/updateBusStatus?id=${encodeURIComponent(id)}&boardingArea=${encodeURIComponent(boardingArea)}`);
            updateServerSidePropsFunction();
        }
    ;

