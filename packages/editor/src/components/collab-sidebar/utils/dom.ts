import type { NoteId } from './types';

/**
 * Build the CSS selector matching a note's in-content `core/note` marker in
 * the editor canvas. The format serializes as `<mark class="wp-note">` with
 * the note id in `data-id`.
 *
 * @param noteId Note id the marker carries.
 * @return Selector for the note's marker element(s).
 */
export function getNoteMarkerSelector( noteId: NoteId ): string {
	/*
	 * `noteId` is a server comment ID (always a positive integer), but the
	 * value composes a selector from stored data, so escape it defensively.
	 *
	 * Deliberately not `CSS.escape`: that escapes for *identifier* context,
	 * where a leading digit is illegal, so it renders the id 7 as `\37 `.
	 * That is valid, and matches, but it makes every rule
	 * `buildHighlightCss` generates unreadable. Inside a quoted attribute
	 * value the only characters that need escaping are the quote, the
	 * backslash, and raw line breaks (a parse error in a CSS string).
	 */
	const escapedId = String( noteId ).replace( /["\\\n\r\f]/g, ( char ) =>
		char === '"' || char === '\\'
			? `\\${ char }`
			: `\\${ char.charCodeAt( 0 ).toString( 16 ) } `
	);
	return `mark.wp-note[data-id="${ escapedId }"]`;
}

/**
 * Measure where a note's floating thread should line up in the canvas.
 *
 * An inline note anchors to its in-content marker, so the thread aligns with
 * the noted text rather than the block, and so does a pending new note through
 * its draft marker. A marker split into several runs (crossing overlaps)
 * resolves to its first run. Anything else falls back to the block itself. An
 * anchor inside collapsed content (e.g. a closed Details) falls back to the
 * closest visible block.
 *
 * Resolved at read time, because rich-text re-renders replace the marker.
 *
 * @param noteId  Note id.
 * @param blockEl Block element the note belongs to.
 * @return Anchor rect, in viewport coordinates.
 */
export function getNoteAnchorRect(
	noteId: NoteId,
	blockEl: HTMLElement
): DOMRect {
	let anchor: Element =
		blockEl.querySelector( getNoteMarkerSelector( noteId ) ) ?? blockEl;
	// Collapsed content still reports the box it would have when expanded,
	// so its size can't tell it apart. Safari < 17.4 lacks `checkVisibility`.
	while ( anchor.checkVisibility?.() === false ) {
		const parentBlock = anchor.parentElement?.closest( '[data-block]' );
		if ( ! parentBlock ) {
			break;
		}
		anchor = parentBlock;
	}
	return anchor.getBoundingClientRect();
}

/**
 * Whether focus is inside an element, in whichever document it lives.
 *
 * @param element Element to check.
 * @return True when the element contains the active element.
 */
export function hasFocusWithin( element: Element | null | undefined ): boolean {
	return !! element?.contains( element.ownerDocument.activeElement );
}

/**
 * Resolve the DOM element for a note thread once it's mounted,
 * or `null` if not found within 3 seconds.
 *
 * @param noteId             Note thread ID.
 * @param container          Container to search within.
 * @param additionalSelector Optional descendant selector.
 * @return Resolved element, or `null` on timeout.
 */
function findNoteThread(
	noteId: NoteId | null | undefined,
	container: HTMLElement | null | undefined,
	additionalSelector?: string
): Promise< HTMLElement | null > {
	if ( ! container ) {
		return Promise.resolve( null );
	}

	// A thread without a noteId is a new note thread.
	const threadSelector =
		noteId && noteId !== 'new'
			? `[role=treeitem][id="note-thread-${ noteId }"]`
			: '[role=treeitem]:not([id])';
	const selector = additionalSelector
		? `${ threadSelector } ${ additionalSelector }`
		: threadSelector;

	return new Promise( ( resolve ) => {
		if ( container.querySelector( selector ) ) {
			return resolve(
				container.querySelector< HTMLElement >( selector )
			);
		}

		// Wait for the element to be added to the DOM.
		const observer = new window.MutationObserver( () => {
			if ( container.querySelector( selector ) ) {
				clearTimeout( timer );
				observer.disconnect();
				resolve( container.querySelector< HTMLElement >( selector ) );
			}
		} );

		observer.observe( container, { childList: true, subtree: true } );

		// Stop trying after 3 seconds.
		const timer = setTimeout( () => {
			observer.disconnect();
			resolve( null );
		}, 3000 );
	} );
}

/**
 * Focus a note thread (or a descendant) and scroll it into view.
 *
 * @param noteId             Note thread ID.
 * @param container          Container to search within.
 * @param additionalSelector Optional descendant selector.
 */
export function focusNoteThread(
	noteId: NoteId | null | undefined,
	container: HTMLElement | null | undefined,
	additionalSelector?: string
): Promise< void > {
	return findNoteThread( noteId, container, additionalSelector ).then(
		( element ) => {
			if ( ! element ) {
				return;
			}
			element.focus();
			element.scrollIntoView( { block: 'nearest' } );
		}
	);
}

/**
 * Scroll a note thread into view without changing focus.
 *
 * @param noteId    Note thread ID.
 * @param container Container to search within.
 */
export function scrollNoteThreadIntoView(
	noteId: NoteId | null | undefined,
	container: HTMLElement | null | undefined
): Promise< void > {
	return findNoteThread( noteId, container ).then( ( element ) => {
		element?.scrollIntoView( { block: 'nearest' } );
	} );
}
