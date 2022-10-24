function matchToFormattedString(match: RegExpMatchArray, index: number): [string, number] {
    return [`+${match[1] ?? "1"} ${match[2]}-${match[3]}-${match[4]}${match[5] !== undefined ? `;${match[5]}` : ""}`, index];
}

export default function formatPhoneNumberString(phoneNumber: string): [string, number][] {
    const matches = phoneNumber.matchAll(/(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *(?:x|ext|#)\.? *(\d+))?/g);

    return [...matches]
        .filter((match) => match.index && phoneNumber.charAt(match.index - 1) !== "❌")
        .map((match) => {
            if (match.index) return matchToFormattedString(match, match.index);
            else throw new Error("unreachable");
        } );
}

export function formatSinglePhoneNumber(phoneNumber: string): string | null {
    const matches = [...phoneNumber.matchAll(/(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *(?:x|ext|#)\.? *(\d+))?/g)];
    if (matches.length !== 1) return null;
    if (matches[0][0] !== phoneNumber) return null;
    if (!matches[0].index) return null;
    return matchToFormattedString(matches[0], matches[0].index)[0];
}

export function directlyMatchesPhoneNumber(phoneNumber: string): boolean {
    return formatSinglePhoneNumber(phoneNumber) === phoneNumber;
}
