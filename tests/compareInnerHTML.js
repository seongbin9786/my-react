const removeAllWhitespacesBetweenTags = (html) => html.replace(/>\s+</g, '><').trim();

export const compareInnerHTML = (a, b) => {
    const minimumA = removeAllWhitespacesBetweenTags(a);
    const minimumB = removeAllWhitespacesBetweenTags(b);

    return minimumA == minimumB;
}
