export default function permParseFunc(permList: readonly string[]) {
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
