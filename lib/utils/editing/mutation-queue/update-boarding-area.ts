import { BoardingArea, BusId, SchoolId } from "@utils/proptypes";
import { MutationType } from ".";

export type UpdateBoardingArea = {
    __type: MutationType.UP_B_BOARD,
    s_id: SchoolId,
    b_id: BusId,
    b_area: BoardingArea,
};

const updateBoardingArea = (area: UpdateBoardingArea) => {
    const { id, boardingArea } = {
        id: encodeURIComponent(area.b_id.toString()),
        boardingArea: encodeURIComponent(area.b_area.text),
    };
    return fetch(`/api/updateBusStatus?id=${id}&boardingArea=${boardingArea}`);
};

export default updateBoardingArea;
