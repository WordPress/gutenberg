/**
 * Read the current caret (or selection) from block-editor selection state when
 * it sits inside a single rich-text attribute, returning normalized anchor
 * data. Unlike `readInlineSelection`, this accepts a *collapsed* caret
 * (`start === end`) so callers driving insertion (typing) get a position even
 * when nothing is selected. Returns null for block-level or cross-attribute
 * selections.
 *
 * @param {Function} getSelectionStart Block-editor selector.
 * @param {Function} getSelectionEnd   Block-editor selector.
 * @return {?Object} { clientId, attributeKey, start, end } or null.
 */
export function readInlineCaret( getSelectionStart, getSelectionEnd ) {
	const start = getSelectionStart();
	const end = getSelectionEnd();
	if (
		! start?.clientId ||
		start.clientId !== end.clientId ||
		! start.attributeKey ||
		start.offset === undefined ||
		end.offset === undefined
	) {
		return null;
	}
	// Normalize direction so callers don't have to think about reversed ranges.
	const [ startOffset, endOffset ] =
		start.offset <= end.offset
			? [ start.offset, end.offset ]
			: [ end.offset, start.offset ];
	return {
		clientId: start.clientId,
		attributeKey: start.attributeKey,
		start: startOffset,
		end: endOffset,
	};
}
