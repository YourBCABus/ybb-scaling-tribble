const getBoardingArea = (boardingArea: string | null, invalidateTime: string | number | Date | null) => {
    return new Date() > new Date(invalidateTime ?? new Date(0)) ? "?" : (boardingArea ?? "?");
};

export default getBoardingArea;
