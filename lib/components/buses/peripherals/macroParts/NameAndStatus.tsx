import { EditField } from "lib/utils/hooks/useSavableEditField";
import { BusTypeSepProps } from "../../Bus";

import BusName from "../inputs/BusName";
import Status from "../other/Status";

import { CamelCase } from "lib/utils/style/styleproxy";

export interface NameAndStatusInterface {
    name: EditField<string, void>;
    boardingAreaText: string;
    sizeClassBuilder: CamelCase.WrapperBuilder.WrapCamelCaseBuilder;
    display: BusTypeSepProps["display"];
    editing: BusTypeSepProps["editing"];
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
                {...{ available: display.available, boardingAreaText }} />
        </div>
    );
};

export default NameAndStatus;
