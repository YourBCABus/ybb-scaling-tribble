interface PermStructure<T> {
    read: T;
    bus: {
        create: T;
        update: T;
        updateStatus: T;
        delete: T;
    };
    stop: {
        create: T;
        update: T;
        delete: T;
    };
    alert: {
        create: T;
        update: T;
        delete: T;
    };
    dismissalTimeData: {
        create: T;
        update: T;
        delete: T;
    };
    school: {
        manage: T;
        updateMappingData: T;
    };
}

type OptionalPermStructure<T> = {
    [key in keyof Partial<PermStructure<T>>]: Partial<PermStructure<T>[key]>;
}

export default function permParseFunc(permList: readonly string[]): PermStructure<boolean> {
    return {
        read: permList.includes("read"),
        bus: {
            create: permList.includes("bus.create"),
            update: permList.includes("bus.update"),
            updateStatus: permList.includes("bus.updateStatus"),
            delete: permList.includes("bus.delete"),
        },
        stop: {
            create: permList.includes("stop.create"),
            update: permList.includes("stop.update"),
            delete: permList.includes("stop.delete"),
        },
        alert: {
            create: permList.includes("alert.create"),
            update: permList.includes("alert.update"),
            delete: permList.includes("alert.delete"),
        },
        dismissalTimeData: {
            create: permList.includes("dismissalTimeData.create"),
            update: permList.includes("dismissalTimeData.update"),
            delete: permList.includes("dismissalTimeData.delete"),
        },
        school: {
            manage: permList.includes("school.manage"),
            updateMappingData: permList.includes("school.updateMappingData"),
        },
    };
}


export function maskPerms(origPerms: PermStructure<boolean>, mask: OptionalPermStructure<boolean> ): PermStructure<boolean> {
    return {
        read: mask.read ?? origPerms.read,
        bus: {
            create: mask.bus?.create ?? origPerms.bus.create,
            update: mask.bus?.update ?? origPerms.bus.update,
            updateStatus: mask.bus?.updateStatus ?? origPerms.bus.updateStatus,
            delete: mask.bus?.delete ?? origPerms.bus.delete,
        },
        stop: {
            create: mask.stop?.create ?? origPerms.stop.create,
            update: mask.stop?.update ?? origPerms.stop.update,
            delete: mask.stop?.delete ?? origPerms.stop.delete,
        },
        alert: {
            create: mask.alert?.create ?? origPerms.alert.create,
            update: mask.alert?.update ?? origPerms.alert.update,
            delete: mask.alert?.delete ?? origPerms.alert.delete,
        },
        dismissalTimeData: {
            create: mask.dismissalTimeData?.create ?? origPerms.dismissalTimeData.create,
            update: mask.dismissalTimeData?.update ?? origPerms.dismissalTimeData.update,
            delete: mask.dismissalTimeData?.delete ?? origPerms.dismissalTimeData.delete,
        },
        school: {
            manage: mask.school?.manage ?? origPerms.school.manage,
            updateMappingData: mask.school?.updateMappingData ?? origPerms.school.updateMappingData,
        },
    };
}
