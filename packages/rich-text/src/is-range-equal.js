/**
 * Returns true if two ranges are equal, or false otherwise. Ranges are
 * considered equal if their start and end occur in the same container and
 * offset.
 *
 * @param {Range|null} a First range object to test.
 * @param {Range|null} b First range object to test.
 *
 * @return {boolean} Whether the two ranges are equal.
 */
export function isRangeEqual( a, b ) {
	return (
		a === b ||
		( a &&
			b &&
			a.startContainer === b.startContainer &&
			a.startOffset === b.startOffset &&
			a.endContainer === b.endContainer &&
			a.endOffset === b.endOffset )
	);
}
