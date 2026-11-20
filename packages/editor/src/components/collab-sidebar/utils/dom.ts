import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { unlock } from '../../../lock-unlock';
import type { NoteId } from './types';

const { ownsSelection } = unlock< {
	ownsSelection: ( element: HTMLElement ) => boolean;
} >( richTextPrivateApis );

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
 * Measure where the thread of a block with no element should line up. A block
 * hidden at the current viewport renders nothing once it is deselected, so
 * its thread takes the block's place in the document: the top of the next
 * rendered block, or the bottom of the previous one after the last block.
 *
 * @param clientId         Client ID of the block with no element, if it still exists.
 * @param orderedClientIds Client IDs of every block, in document order.
 * @param doc              Document of the editor canvas, once known.
 * @return Anchor top in viewport coordinates, or `null` without a rendered block.
 */
export function getHiddenBlockAnchorTop(
	clientId: string | undefined,
	orderedClientIds: string[],
	doc: Document | undefined
): number | null {
	const index = orderedClientIds.indexOf( clientId! );
	if ( ! doc || index === -1 ) {
		return null;
	}
	// Collapsed content (e.g. a closed Details) still reports the box it
	// would have when expanded, so it doesn't count as rendered.
	const getRect = ( id: string ) => {
		const element = doc.getElementById( `block-${ id }` );
		return element?.checkVisibility?.() === false
			? undefined
			: element?.getBoundingClientRect();
	};
	for ( const id of orderedClientIds.slice( index + 1 ) ) {
		const rect = getRect( id );
		if ( rect ) {
			return rect.top;
		}
	}
	for ( const id of orderedClientIds.slice( 0, index ).reverse() ) {
		const rect = getRect( id );
		if ( rect ) {
			return rect.bottom;
		}
	}
	return null;
}

/**
 * Whether one of the blocks holds focus. When the selected block supports
 * `editableRoot`, the canvas is the editing host and holds focus itself, so
 * the block of the editable owning the selection holds it.
 *
 * @param ownerDocument The blocks' document.
 * @param clientIds     Block client IDs.
 * @return Whether one of the blocks holds focus.
 */
export function isFocusInBlocks(
	ownerDocument: Document | null | undefined,
	clientIds: string[]
): boolean {
	// A document keeps its active element and selection after losing focus.
	if ( ! ownerDocument?.hasFocus() ) {
		return false;
	}
	const anchorNode = ownerDocument.defaultView?.getSelection()?.anchorNode;
	const anchor =
		anchorNode?.nodeType === Node.ELEMENT_NODE
			? ( anchorNode as Element )
			: anchorNode?.parentElement;
	const editable = anchor?.closest< HTMLElement >(
		'[contenteditable="true"]'
	);
	const focusOwner =
		editable && ownsSelection( editable )
			? editable
			: ownerDocument.activeElement;
	const block =
		focusOwner?.closest< HTMLElement >( '[data-block]' )?.dataset.block;
	return !! block && clientIds.includes( block );
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
