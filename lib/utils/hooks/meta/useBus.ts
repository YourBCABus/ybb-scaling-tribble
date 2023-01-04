import { GetBus_bus } from "@graph-types/GetBus";
import { BusId } from "@utils/proptypes";
import { useMemo } from "react";

interface ProcessedBus {
    b_id: BusId;
    b_name: string | null;
    
}

const useBus = (graphBus: GetBus_bus): ProcessedBus => {
    const processedPerms = useMemo<ProcessedBus>(
        () => graphBus && ({
            b_id: new BusId(graphBus.id),
            b_name: graphBus.name ?? "",
        }),
        [graphBus],
    );

    return processedPerms;
};

export default useBus;
