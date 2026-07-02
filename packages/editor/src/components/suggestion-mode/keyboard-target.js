/**
 * WordPress dependencies
 */
import { create } from '@wordpress/rich-text';

/**
 * Shared DOM-target helpers for the suggest-mode keyboard interceptors
 * (`suggestion-addition-keyboard.js`, `suggestion-deletion-keyboard.js`).
 */

/*
 * The block rich-text editable root: the element `useRichText` binds to. The
 * canvas renders it with both the class and (for block attributes) the
 * attribute-key data attribute; matching either keeps this in sync with
 * `isEventTargetSelectedRichText` below.
 */
const RICH_TEXT_EDITABLE_SELECTOR =
	'.block-editor-rich-text__editable, [data-wp-block-attribute-key]';

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
	const editable = target.closest( RICH_TEXT_EDITABLE_SELECTOR );
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

/**
 * Read the offsets an input event affects from the DOM itself, mapped into
 * rich-text (character) offsets within the event's rich-text editable.
 *
 * The keyboards must not anchor marker writes to the block-editor store's
 * selection offsets: the store selection is synced from the DOM asynchronously
 * (`selectionchange`), so after a marker write re-renders RichText followed by
 * caret movement, a fast typist's `beforeinput` fires BEFORE the store has
 * caught up — writing the marker at stale offsets corrupts the content (e.g.
 * splitting an existing marker mid-word). The DOM is the truth at input time:
 *
 * 1. `event.getTargetRanges()[ 0 ]` — the exact range the input will affect,
 *    per the Input Events spec (a `StaticRange`; present on `beforeinput`).
 * 2. Otherwise the live DOM selection (clipboard events such as `paste`/`cut`
 *    expose no target ranges, and callers intercepting deletion pass
 *    `preferTargetRanges: false` because a delete's target range is already
 *    expanded to the text being removed, while they need the caret/selection
 *    that triggered it).
 *
 * The range is mapped to offsets with the same call RichText and the
 * block-editor selection observer use for DOM ranges:
 * `create( { element, range, __unstableIsEditableTree: true } )`. `create`
 * only reads `startContainer`/`startOffset`/`endContainer`/`endOffset`, so a
 * `StaticRange` works interchangeably with a live `Range`.
 *
 * Returns null when no editable or usable range exists (callers then fall back
 * to the store-based offsets, the previous behavior).
 *
 * @param {Event}   event                             Input/clipboard event.
 * @param {Object}  [options]                         Options.
 * @param {boolean} [options.preferTargetRanges=true] Whether to consult
 *                                                    `getTargetRanges()` before
 *                                                    the live selection.
 * @return {?{start: number, end: number}} Normalized offsets, or null.
 */
export function readEventRange( event, { preferTargetRanges = true } = {} ) {
	const target = event?.target;
	if ( ! target || typeof target.closest !== 'function' ) {
		return null;
	}
	const editable =
		target.closest( RICH_TEXT_EDITABLE_SELECTOR ) ||
		target.closest( '[contenteditable="true"]' );
	if ( ! editable ) {
		return null;
	}
	let range = null;
	if ( preferTargetRanges && typeof event.getTargetRanges === 'function' ) {
		range = event.getTargetRanges()[ 0 ] ?? null;
	}
	if ( ! range ) {
		const selection = editable.ownerDocument?.defaultView?.getSelection?.();
		range =
			selection && selection.rangeCount > 0
				? selection.getRangeAt( 0 )
				: null;
	}
	if ( ! range ) {
		return null;
	}
	/*
	 * Both endpoints must live inside this editable: a range reaching outside
	 * (e.g. a cross-block selection) has no single-attribute offset mapping.
	 */
	if (
		! editable.contains( range.startContainer ) ||
		! editable.contains( range.endContainer )
	) {
		return null;
	}
	try {
		const { start, end } = create( {
			element: editable,
			range,
			__unstableIsEditableTree: true,
		} );
		if ( start === undefined || end === undefined ) {
			return null;
		}
		// Normalize direction so callers don't have to think about order.
		return start <= end ? { start, end } : { start: end, end: start };
	} catch {
		return null;
	}
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
