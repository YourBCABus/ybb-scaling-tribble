export const saveBoardingAreaCallback = 
    (updateServerSidePropsFunction: () => void) => 
        (id: string) => 
            async (boardingArea: string | null): Promise<void> => {
                if (boardingArea == null) {
                    boardingArea = "?";
                }
                await fetch(`/api/updateBusStatus?id=${encodeURIComponent(id)}&boardingArea=${encodeURIComponent(boardingArea)}`);
                updateServerSidePropsFunction();
            }
    ;

