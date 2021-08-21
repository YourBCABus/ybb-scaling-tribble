export default function getBoardingArea(boardingArea: string | null, invalidateTime: Date) {
    return new Date() > new Date(invalidateTime) ? "?" : (boardingArea ?? "?");
}
