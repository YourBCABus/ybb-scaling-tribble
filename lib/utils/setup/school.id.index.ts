export const getInitialStars = () => new Set(
    (
        JSON
            .parse(localStorage.getItem("starred") ?? "[]") as string[]
    )
        .concat(migrateOldStarredBuses())
);

export const migrateOldStarredBuses = (): string[] => {
    const oldBusJSON = localStorage.getItem("ngx-webstorage|ybbstarredbuses");
    if (oldBusJSON) {
        try {
            const parsed = JSON.parse(oldBusJSON);
            if (!(parsed instanceof Array)) throw new Error("Old starred buses is not an array");
            localStorage.removeItem("ngx-webstorage|ybbstarredbuses");
            return parsed;
        } catch (e) {
            console.log("Unable to parse old starred buses");
            console.error(e);
        }
    }
    return [];
};
