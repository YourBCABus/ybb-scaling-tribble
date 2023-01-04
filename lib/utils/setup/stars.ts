export const cookieNames = {
    v1: "ngx-webstorage|ybbstarredbuses",
    v2: "starred",
};

export const getInitialStars = () => {
    const v1Buses = migrateOldStarredBuses();

    const json: unknown = JSON.parse(localStorage.getItem(cookieNames.v2) ?? "[]");
    
    if (!Array.isArray(json)) {
        localStorage.setItem(cookieNames.v2, JSON.stringify(v1Buses));
        return new Set(v1Buses);
    }

    return new Set(json.flatMap(val => typeof val === 'string' ? [val] : []).concat(v1Buses));
};

export const migrateOldStarredBuses = (): string[] => {
    const oldBusJSON = localStorage.getItem(cookieNames.v1);
    if (oldBusJSON) {
        try {
            const json = JSON.parse(oldBusJSON);
            if (!Array.isArray(json)) {
                console.error("Invalid v1 starred buses format:", json);
                return [];
            }
            const v1BusIds = (json as unknown[]).flatMap(val => typeof val === 'string' ? [val] : []);

            localStorage.removeItem(cookieNames.v1);
            return v1BusIds;
        } catch (e) {
            console.error("Unable to parse v1 starred buses");
            console.error(e);
        }
    }
    return [];
};
