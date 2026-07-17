/**
 * Read an inline selection from block-editor selection state, returning
 * normalized anchor data when a non-collapsed selection sits inside a single
 * rich-text attribute. Returns null for block-level or collapsed selections.
 *
 * @param {Function} getSelectionStart Block-editor selector.
 * @param {Function} getSelectionEnd   Block-editor selector.
 * @return {?Object} { clientId, attributeKey, start, end } or null.
 */
export function readInlineSelection( getSelectionStart, getSelectionEnd ) {
	const start = getSelectionStart();
	const end = getSelectionEnd();
	if (
		! start?.clientId ||
		start.clientId !== end.clientId ||
		! start.attributeKey ||
		start.offset === undefined ||
		end.offset === undefined ||
		start.offset === end.offset
	) {
		return null;
	}
	// Normalize direction so callers don't have to think about reversed ranges.
	const [ startOffset, endOffset ] =
		start.offset < end.offset
			? [ start.offset, end.offset ]
			: [ end.offset, start.offset ];
	return {
		clientId: start.clientId,
		attributeKey: start.attributeKey,
		start: startOffset,
		end: endOffset,
	};
}
