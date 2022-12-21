import { BusId, MappingBoardingArea } from "./proptypes";

export type HoverEvent = {
    enabled: boolean;
    area: MappingBoardingArea;
    targetId: BusId;
};

export type DropEvent = {
    area: MappingBoardingArea;
    targetId: BusId;
};

export type CancelEvent = {
    area: MappingBoardingArea;
    targetId: BusId;
};
export type ConfirmEvent = {
    area: MappingBoardingArea;
    targetId: BusId;
};

type DragDropEvent = HoverEvent | DropEvent | CancelEvent | ConfirmEvent;

export type Handler<T> = (event: T) => void;

const getTarget = <T extends DragDropEvent>(map: Map<string, Handler<T>>, event: T) => map.get(event.targetId.toString());

export default class DragDropEventHandler {
    private hoverMap: Map<string, Handler<HoverEvent>>;
    
    private dropMap: Map<string, Handler<DropEvent>>;
    private dropGeneral: Map<string, Handler<DropEvent>>;

    private cancelMap: Map<string, Handler<CancelEvent>>;
    private confirmMap: Map<string, Handler<ConfirmEvent>>;
    private cancelGeneral: Map<string, Handler<DropEvent>>;
    private confirmGeneral: Map<string, Handler<DropEvent>>;

    

    private dropped?: DropEvent;

    public constructor() {
        this.hoverMap = new Map();
        this.dropMap = new Map();
        this.cancelMap = new Map();
        this.confirmMap = new Map();

        this.dropGeneral = new Map();
        this.cancelGeneral = new Map();
        this.confirmGeneral = new Map();
    }

    public setHoverHandler(id: BusId, handler: Handler<HoverEvent>): void {
        this.hoverMap.set(id.toString(), handler);
    }
    public sendHoverEvent(event: HoverEvent) {
        getTarget(this.hoverMap, event)?.(event);
        this.hoverMap.get(event.targetId.toString())?.(event);
    }

    public setDropHandler(id: BusId, handler: Handler<DropEvent>): void {
        this.dropMap.set(id.toString(), handler);
    }
    public setDropGeneral(handlerName: string, handler: Handler<DropEvent>): void {
        this.dropGeneral.set(handlerName, handler);
    }
    public sendDropEvent(event: DropEvent) {
        console.log(event);
        this.dropped = event;
        getTarget(this.dropMap, event)?.(event);
        [...this.dropGeneral.values()].forEach(handler => handler(event));
    }

    public setCancelHandler(id: BusId, handler: Handler<CancelEvent>): void {
        this.cancelMap.set(id.toString(), handler);
    }
    public setCancelGeneral(handlerName: string, handler: Handler<CancelEvent>): void {
        this.cancelGeneral.set(handlerName, handler);
    }
    public sendCancelEvent() {
        const droppedVal = this.dropped;
        if (droppedVal) {
            getTarget(this.cancelMap, droppedVal)?.(droppedVal);
            [...this.cancelGeneral.values()].forEach(handler => handler(droppedVal));
        }
        this.dropped = undefined;
    }

    public setConfirmHandler(id: BusId, handler: Handler<ConfirmEvent>): void {
        this.confirmMap.set(id.toString(), handler);
    }
    public setConfirmGeneral(handlerName: string, handler: Handler<ConfirmEvent>): void {
        this.confirmGeneral.set(handlerName, handler);
    }
    public sendConfirmEvent() {
        const droppedVal = this.dropped;
        if (droppedVal) {
            getTarget(this.confirmMap, droppedVal)?.(droppedVal);
            [...this.confirmGeneral.values()].forEach(handler => handler(droppedVal));
        }
        this.dropped = undefined;
    }
}
