import { BusId } from "@utils/proptypes";
import { cookieNames, getInitialStars } from "@utils/setup/stars";
import { useCallback } from "react";
import { useStateChangeClientSide } from "./useStateChange";

const makeStarCallback = (
    setStarredSet: (newStarred: Set<string>) => void,
    currStarred: Set<string>,
) => (id: string, event: Event) => {
    event.stopPropagation();
    event.preventDefault();

    const newStarred = new Set(currStarred);
    if (newStarred.has(id)) newStarred.delete(id);
    else newStarred.add(id);

    setStarredSet(newStarred);
};

const useStars = () => {
    const [starred, setStarred] = useStateChangeClientSide(
        getInitialStars,
        (_, newStarIDs) => localStorage.setItem(
            cookieNames.v2,
            JSON.stringify([...newStarIDs]),
        ),
        new Set(),
    );

    const starCallback = useCallback(
        <T extends Event>(id: BusId, event: T) => makeStarCallback(setStarred, starred)(id.toString(), event),
        [setStarred, starred],
    );

    return [starred, starCallback] as const;
};

export default useStars;
