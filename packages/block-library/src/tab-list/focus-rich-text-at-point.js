/**
 * Places the caret in a rich text element at the position corresponding to
 * a given point in the viewport.
 *
 * Inline images (and other embedded rich text objects) have
 * `pointer-events: none` applied so that block-level dragging can capture
 * the event (see `packages/block-editor/src/components/block-draggable/content.scss`).
 * That means a click that visually lands on one of them resolves, at the
 * browser's event-dispatch level, to whichever ancestor does receive
 * pointer events instead. In a plain paragraph that ancestor is the
 * paragraph's own contenteditable element, so the browser's native
 * click-to-place-caret behavior still applies. When the rich text is
 * nested inside an interactive element such as a `<button>` — as tab
 * titles are — clicking through the image instead just focuses the
 * button, and the caret is never placed in the rich text at all, so the
 * image never becomes "selected" and its format toolbar (width,
 * alternative text, etc.) never appears.
 *
 * This resolves the caret position for the click manually, using the same
 * point-to-caret APIs the browser relies on internally, and focuses the
 * rich text there so its own selection handling can take over normally.
 *
 * @param {HTMLElement} richTextElement The rich text's contenteditable element.
 * @param {number}      x               Horizontal client coordinate of the click.
 * @param {number}      y               Vertical client coordinate of the click.
 *
 * @return {boolean} Whether the caret was successfully placed.
 */
export default function focusRichTextAtPoint( richTextElement, x, y ) {
	const doc = richTextElement.ownerDocument;
	let range;

	if ( doc.caretPositionFromPoint ) {
		const position = doc.caretPositionFromPoint( x, y );
		if ( position ) {
			range = doc.createRange();
			range.setStart( position.offsetNode, position.offset );
			range.collapse( true );
		}
	} else if ( doc.caretRangeFromPoint ) {
		range = doc.caretRangeFromPoint( x, y );
	}

	if ( ! range ) {
		return false;
	}

	richTextElement.focus();

	const selection = doc.defaultView.getSelection();
	selection.removeAllRanges();
	selection.addRange( range );

	return true;
}
