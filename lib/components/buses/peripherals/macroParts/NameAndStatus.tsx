import { EditField } from "lib/utils/hooks/useSavableEditField";
import { BusSepProps } from "@bus-comps/Bus";

import BusName from "../inputs/BusName";
import Status from "../other/Status";

import { CamelCase } from "lib/utils/style/styleproxy";

export interface NameAndStatusInterface {
    name: EditField<string, unknown>;
    boardingAreaText: string;
    sizeClassBuilder: CamelCase.WrapperBuilder.WrapCamelCaseBuilder;
    display: BusSepProps["display"];
    editing: BusSepProps["editing"];
}

const NameAndStatus = (
    {
        name, boardingAreaText, 
        sizeClassBuilder, display,
        editing,
    }: NameAndStatusInterface
): JSX.Element => {
    return (
        <div className={sizeClassBuilder.busNameAndStatus()}>
            <BusName
                name={name}
                editing={!!editing.editing}
                editFreeze={editing.editFreeze}
                size={display.size} />
            <br/>
            <Status
                {...{ available: display.running, boardingAreaText }} />
        </div>
    );
};

export default NameAndStatus;
