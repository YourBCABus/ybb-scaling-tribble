import { BusInput } from "@graph-types/globalTypes";
import { BusData, BusId, SchoolId } from "@utils/proptypes";
import { MutationType } from ".";

export type UpdateBusName = {
    __type: MutationType.UP_B_NAME,
    s_id: SchoolId,
    b_id: BusId,
    b_curr: BusData,
    b_name: string,
};
export type UpdateBusActivation = {
    __type: MutationType.UP_B_ACT,
    s_id: SchoolId,
    b_id: BusId,
    b_curr: BusData,
    b_activated: boolean,
};
export type UpdateBusPhones = {
    __type: MutationType.UP_B_PHONES,
    s_id: SchoolId,
    b_id: BusId,
    b_curr: BusData,
    b_phones: string[],
};
type UpdateBusMutation = UpdateBusName | UpdateBusActivation | UpdateBusPhones;

const updateBus = (map: (old: BusInput) => BusInput) => async (mutation: UpdateBusMutation) => {
    const { b_id, b_curr } = mutation;
    const id = encodeURIComponent(b_id.toString());
    const input = b_curr.input;
    if (!input) throw new Error("Incomplete Bus Data for updating!");
    const data = encodeURIComponent(JSON.stringify(map(input)));
    return await fetch(`/api/updateBus?id=${id}&busData=${data}`);
};

export const updateBusName = (nameMutation: UpdateBusName) => updateBus(
    old => ({ ...old, name: nameMutation.b_name })
)(nameMutation);


export const updateBusActivation = (activationMutation: UpdateBusActivation) => updateBus(
    old => ({ ...old, available: activationMutation.b_activated })
)(activationMutation);


export const updateBusPhones = (phoneMutation: UpdateBusPhones) => updateBus(
    old => ({ ...old, phone: phoneMutation.b_phones })
)(phoneMutation);
