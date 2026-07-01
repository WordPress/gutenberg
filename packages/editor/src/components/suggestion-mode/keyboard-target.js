/**
 * Shared DOM-target helpers for the suggest-mode keyboard interceptors
 * (`suggestion-addition-keyboard.js`, `suggestion-deletion-keyboard.js`).
 */

/**
 * Collect every document the editor canvas might live in: the top document and
 * the contents of each (same-origin) iframe. The canvas is usually iframed and
 * native input events don't cross that boundary, so the listener has to be
 * attached to the canvas document directly. The handlers' own guards keep them
 * from acting on edits outside a block's rich text, so attaching broadly is
 * safe.
 *
 * @return {Document[]} Candidate documents.
 */
/**
 * Whether an input event targets the block-editor rich-text element bound to
 * the current block-editor selection.
 *
 * The keyboards attach capture-phase listeners to the top document and every
 * same-origin iframe, so they see input for EVERY contentEditable on the page:
 * the collab-sidebar note composer (`RichTextControl`), plugin-rendered
 * editables, and so on. Block selection persists while focus sits in the
 * sidebar, so acting on `isContentEditable` alone would cancel typing in a
 * note reply and write it into the previously selected block as a suggestion
 * marker. Only intercept when the event target is inside the selected block's
 * element AND inside a block rich-text editable whose attribute key (when
 * exposed) matches the selection's.
 *
 * @param {Event}   event          Input/clipboard event.
 * @param {?Object} selectionStart Block-editor `getSelectionStart()` value.
 * @return {boolean} True when the event targets the selected rich text.
 */
export function isEventTargetSelectedRichText( event, selectionStart ) {
	const target = event?.target;
	const clientId = selectionStart?.clientId;
	if (
		! target ||
		! clientId ||
		! target.isContentEditable ||
		typeof target.closest !== 'function'
	) {
		return false;
	}
	// The innermost block element containing the target must be the block the
	// store says is selected — the canvas block list renders each block with
	// `data-block="<clientId>"`; sidebar/plugin editables have no such wrapper.
	const blockElement = target.closest( '[data-block]' );
	if (
		! blockElement ||
		blockElement.getAttribute( 'data-block' ) !== clientId
	) {
		return false;
	}
	// The target must sit inside a block rich-text editable, not some other
	// editable region nested in the block wrapper.
	const editable = target.closest(
		'.block-editor-rich-text__editable, [data-wp-block-attribute-key]'
	);
	if ( ! editable ) {
		return false;
	}
	// When both the selection and the editable expose an attribute key,
	// require them to match so a multi-field block (e.g. quote citation) is
	// only intercepted in the field the selection points at.
	const editableKey = editable.getAttribute( 'data-wp-block-attribute-key' );
	if (
		selectionStart.attributeKey &&
		editableKey &&
		editableKey !== selectionStart.attributeKey
	) {
		return false;
	}
	return true;
}

export function getCandidateDocuments() {
	const docs = [ document ];
	for ( const iframe of document.querySelectorAll( 'iframe' ) ) {
		let doc = null;
		try {
			doc = iframe.contentDocument;
		} catch {
			// Cross-origin iframe — not the editor canvas; skip.
			doc = null;
		}
		if ( doc && ! docs.includes( doc ) ) {
			docs.push( doc );
		}
	}
	return docs;
}
