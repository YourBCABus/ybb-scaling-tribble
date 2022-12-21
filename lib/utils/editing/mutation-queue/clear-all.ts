import { SchoolId } from "@utils/proptypes";
import { MutationType } from ".";

export type ClearAll = {
    __type: MutationType.CL_ALL,
    s_id: SchoolId,
};

const clearAll = (clear: ClearAll) => {
    return fetch(`/api/clearAll?schoolId=${clear.s_id.toString()}`);
};

export default clearAll;
