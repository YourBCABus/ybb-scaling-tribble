import { BusId, SchoolId } from "@utils/proptypes";
import { MutationType } from ".";


export type CreateBus = {
    __type: MutationType.CR_B,
    s_id: SchoolId,
};
export const createBus = async (mutation: CreateBus) => {
    const { s_id } = mutation;
    const id = encodeURIComponent(s_id.toString());
    return await fetch(`/api/createBus?schoolId=${id}`);
};


export type DeleteBus = {
    __type: MutationType.DL_B,
    b_id: BusId,
};
export const deleteBus = async (mutation: DeleteBus) => {
    const { b_id } = mutation;
    const id = encodeURIComponent(b_id.toString());
    return await fetch(`/api/deleteBus?busId=${id}`);
};

