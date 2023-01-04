import { GetSchoolAndPerms_school } from "@graph-types/GetSchoolAndPerms";
import { BusData, MappingBoardingArea, SchoolId } from "@utils/proptypes";
import { useMemo } from "react";

interface ProcessedSchool {
    s_id: SchoolId;
    s_buses: BusData[];
    s_name: string | null;
    s_mappingAreas: MappingBoardingArea[];
}

const useSchool = (graphSchool: GetSchoolAndPerms_school): ProcessedSchool => {
    const processedPerms = useMemo<ProcessedSchool>(
        () => graphSchool && ({
            s_id: new SchoolId(graphSchool.id),
            s_name: graphSchool.name,
            s_buses: graphSchool.buses.map(data => BusData.fromSchool(data)),
            s_mappingAreas: graphSchool.mappingData?.boardingAreas.map(MappingBoardingArea.fromGraphQL) ?? [],
        }),
        [graphSchool],
    );

    return processedPerms;
};

export default useSchool;
