import permParseFunc, { PermStructure } from "@utils/general/perms";
import { useMemo } from "react";

const usePerms = (graphPermissions: string[]): PermStructure<boolean> => {
    const processedPerms = useMemo(
        () => permParseFunc(graphPermissions),
        [graphPermissions],
    );

    return processedPerms;
};

export default usePerms;
