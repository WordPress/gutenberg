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
 * A zero-height rect marking where a block with no rendered element sits.
 */
export interface BoundaryRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

/**
 * Derives a stand-in anchor rect for a block that has no rendered element,
 * which happens when the block is hidden at the current viewport: `block.js`
 * renders nothing for it once it is deselected.
 *
 * The rect marks the gap the block leaves between its rendered neighbours,
 * so its threads keep their place in the notes column instead of collapsing
 * to the top of the panel. Centring it in the gap matches where the block
 * itself sits while it is selected - still hidden, but back in the DOM
 * collapsed to zero height between two block gaps - so selecting a thread
 * does not shift it.
 *
 * The element lookup is injected to keep this testable without a DOM.
 *
 * @param clientId         Client ID of the block with no element.
 * @param orderedClientIds Client IDs in document order.
 * @param getBlockElement  Resolves a client ID to its element, or null.
 * @return Zero-height boundary rect, or `null` when no block in the document
 *         is rendered.
 */
export function getHiddenBlockAnchorRect(
	clientId: string | undefined,
	orderedClientIds: string[] | undefined,
	getBlockElement: (
		clientId: string
	) =>
		| ( Pick< Element, 'getBoundingClientRect' > &
				Partial< Pick< Element, 'checkVisibility' > > )
		| null
): BoundaryRect | null {
	const index =
		clientId === undefined
			? -1
			: ( orderedClientIds?.indexOf( clientId ) ?? -1 );
	if ( ! orderedClientIds || index === -1 ) {
		return null;
	}

	// Blocks nested inside a hidden block have no element either, so both
	// walks skip whole hidden subtrees on their way to a rendered block.
	// Collapsed content (e.g. a closed Details) still reports the box it
	// would have when expanded, so skip it as well.
	const findRect = ( from: number, step: number ) => {
		for ( let i = from; i >= 0 && i < orderedClientIds.length; i += step ) {
			const element = getBlockElement( orderedClientIds[ i ] );
			if ( element && element.checkVisibility?.() !== false ) {
				return element.getBoundingClientRect();
			}
		}
		return null;
	};

	const next = findRect( index + 1, 1 );
	const previous = findRect( index - 1, -1 );

	if ( ! next && ! previous ) {
		return null;
	}

	let top: number;
	if ( next && previous ) {
		top = ( previous.top + previous.height + next.top ) / 2;
	} else if ( next ) {
		top = next.top;
	} else {
		top = previous!.top + previous!.height;
	}

	const { left, width } = ( next ?? previous )!;
	return { top, left, width, height: 0 };
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
