export type HoverEvent = {
    enabled: boolean;
    areaText: string;
    targetId: string;
};

export type DropEvent = {
    areaText: string;
    targetId: string;
};

export type CancelEvent = {
    areaText: string;
    targetId: string;
};
export type ConfirmEvent = {
    areaText: string;
    targetId: string;
};


export type Handler<T> = (event: T) => void;

export default class DragDropEventHandler {
    private hoverMap: Map<string, Handler<HoverEvent>>;
    
    private dropMap: Map<string, Handler<DropEvent>>;

    private cancelMap: Map<string, Handler<CancelEvent>>;
    private confirmMap: Map<string, Handler<ConfirmEvent>>;

    

    private dropped?: {
        areaText: string;
        targetId: string;
    };

    public constructor() {
        this.hoverMap = new Map();
        this.dropMap = new Map();
        this.cancelMap = new Map();
        this.confirmMap = new Map();
    }

    public setHoverHandler(id: string, handler: Handler<HoverEvent>): void {
        this.hoverMap.set(id, handler);
    }
    public sendHoverEvent(event: HoverEvent) {
        this.hoverMap.get(event.targetId)?.(event);
    }

    public setDropHandler(id: string, handler: Handler<DropEvent>): void {
        this.dropMap.set(id, handler);
    }
    public sendDropEvent(event: DropEvent) {
        this.dropped = event;
        this.dropMap.get(event.targetId)?.(event);
    }

    public setCancelHandler(id: string, handler: Handler<CancelEvent>): void {
        this.cancelMap.set(id, handler);
    }
    public sendCancelEvent() {
        if (this.dropped) this.cancelMap.get(this.dropped.targetId)?.(this.dropped);
        this.dropped = undefined;
    }

    public setConfirmHandler(id: string, handler: Handler<ConfirmEvent>): void {
        this.confirmMap.set(id, handler);
    }
    public sendConfirmEvent() {
        if (this.dropped) this.confirmMap.get(this.dropped.targetId)?.(this.dropped);
        this.dropped = undefined;
    }
}
