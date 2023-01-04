export const regMatch = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *(?:x|ext|#)\.? *(\d+))?/g;
export const validityMatch = /^(?:\+?(\d{1,3}))? *[-.]? *[(]? *(\d{3}) *[)]? *[-.]? *(\d{3}) *[-.]? *(\d{4}) *(?: *(?:(?:x)|(?:ext)|(?:#))\.? *(\d+))?$/;

export class PhoneNumber {
    country: number;
    area: number;
    three: number;
    four: number;
    extension: number | undefined;

    dataIdx: number;
    dataLen: number;

    constructor({
        country,
        area,
        three,
        four,
        extension,

        dataIdx,
        dataLen,
    }: {
        country: number,
        area: number,
        three: number,
        four: number,
        extension: number | undefined,

        dataIdx: number,
        dataLen: number,
    }) {
        this.country = country;
        this.area = area;
        this.three = three;
        this.four = four;
        this.extension = extension;

        this.dataIdx = dataIdx;
        this.dataLen = dataLen;
    }

    public static tryFormat(str: string): string | undefined {
        const match = str.match(validityMatch);
        if (match) return PhoneNumber.fromMatch(match)?.format;
    }

    public static fromMatch(match: RegExpMatchArray): PhoneNumber | undefined {
        const countryStr = match[1] ?? "1";
        const areaStr = match[2];
        const threeStr = match[3];
        const fourStr = match[4];
        const extensionStr = match[5];

        if (!(countryStr && areaStr && threeStr && fourStr) || match.index === undefined) return;

        const [
            country,
            area,
            three,
            four,
            extension,
        ] = [parseInt(countryStr), parseInt(areaStr), parseInt(threeStr), parseInt(fourStr), extensionStr ? parseInt(extensionStr) : undefined];

        if (Number.isNaN(country) || Number.isNaN(area) || Number.isNaN(three) || Number.isNaN(four) || Number.isNaN(extension)) return;

        return new PhoneNumber({ country, area, three, four, extension, dataIdx: match.index, dataLen: match[0].length });
    }

    public get format() {
        const main = `+${this.country} ${this.area}-${this.three}-${this.four}`;
        if (this.extension) return `${main}#${this.extension}`;
        else return main;
    }

    public get href() {
        return this.format.replaceAll("#", ";");
    }

    public splice(origData: string) {
        return origData.slice(0, this.dataIdx) + origData.slice(this.dataIdx + this.dataLen);
    }


    public clone() {
        // return new PhoneNumber(this.country, this.area, this.three, this.four, this.extension, this.dataIndex, this.dataLen);
        return new PhoneNumber(this);
    }
}

export class NumberEntry {
    private _data: string;
    private _numbers: PhoneNumber[];

    public constructor(entryData: string) {
        this._data = entryData;
        this._numbers = [...entryData.matchAll(regMatch)]
            .flatMap(numberMatchArr => {
                const number = PhoneNumber.fromMatch(numberMatchArr);
                return number ? [number] : [];
            });
    }

    public get numbers() {
        return this._numbers.map(number => number.clone());
    }

    public spliced(index: number) {
        return new NumberEntry(this._numbers[index].splice(this._data));
    }

    public get data() {
        return this._data;
    }
}
