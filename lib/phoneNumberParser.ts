function matchToFormattedString(match: RegExpMatchArray): [string, number] {
    return [`+${match[1] ?? "1"} ${match[2]}-${match[3]}-${match[4]}${match[5] !== undefined ? `;${match[5]}` : ""}`, match.index!];
}

export default function formatPhoneNumberString(phoneNumber: string): [string, number][] {
    let matches = phoneNumber.matchAll(/(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *(?:x|ext|#)\.? *(\d+))?/g);

    return [...matches]
        .filter((match) => phoneNumber.charAt(match.index! - 1) !== "❌")
        .map((match) => matchToFormattedString(match));
}

export function formatSinglePhoneNumber(phoneNumber: string): string | null {
    let matches = [...phoneNumber.matchAll(/(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *(?:x|ext|#)\.? *(\d+))?/g)];
    if (matches.length !== 1) return null;
    if (matches[0][0] !== phoneNumber) return null;
    return matchToFormattedString(matches[0])[0];
}

export function directlyMatchesPhoneNumber(phoneNumber: string): boolean {
    console.log("", phoneNumber, formatSinglePhoneNumber(phoneNumber));
    return formatSinglePhoneNumber(phoneNumber) === phoneNumber;
}
