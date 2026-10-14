/**
 * Returns true if two ranges are equal, or false otherwise. Ranges are
 * considered equal if their start and end occur in the same container and
 * offset.
 *
 * @param a First range object to test.
 * @param b First range object to test.
 *
 * @return Whether the two ranges are equal.
 */
export function isRangeEqual( a: Range | null, b: Range | null ) {
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
