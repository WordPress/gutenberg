/**
 * Trims rendered note content down to what fits inside the collapsed height.
 *
 * The collapse is a real truncation rather than a visual clip: text past the
 * boundary is removed from the DOM, so nothing hidden by "Show more" stays in
 * the tab order or in the accessibility tree.
 *
 * See https://github.com/WordPress/gutenberg/issues/81458.
 */

const ELLIPSIS = '…';

/*
 * Empty elements are pruned once their text is gone, except for these, which
 * still occupy space or carry meaning without any text of their own.
 */
const VOID_TAGS = new Set( [ 'IMG', 'BR', 'HR', 'INPUT', 'SVG' ] );

/*
 * How many words to walk back looking for room for the ellipsis. It normally
 * fits straight away; the bound just keeps a pathological note from looping.
 */
const MAX_BACKOFF_STEPS = 4;

// How many lines of a long note stay visible while it is collapsed.
const COLLAPSED_LINES = 3;

/*
 * Custom property the collapsed height is written to. The stylesheet cannot
 * work it out on its own: `1lh` is the container's line height, which is not
 * the line height of the paragraphs inside it.
 */
export const COLLAPSED_HEIGHT_PROPERTY = '--wp-note-collapsed-height';

type TextNodeEntry = { node: Text; start: number };

/**
 * Collects an element's text nodes in document order, along with the running
 * character offset each one starts at.
 *
 * @param root Element to walk.
 */
function collectTextNodes( root: HTMLElement ): {
	nodes: TextNodeEntry[];
	text: string;
} {
	const walker = root.ownerDocument.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT
	);
	const nodes: TextNodeEntry[] = [];
	let text = '';
	while ( walker.nextNode() ) {
		const node = walker.currentNode as Text;
		nodes.push( { node, start: text.length } );
		text += node.data;
	}
	return { nodes, text };
}

/**
 * Returns one rect per line box the first `offset` characters lay out on.
 *
 * @param nodes  Text nodes in document order.
 * @param offset Number of leading characters to measure.
 */
function lineRects( nodes: TextNodeEntry[], offset: number ): DOMRect[] {
	const end = nodes.findLast( ( entry ) => entry.start < offset );
	if ( ! end ) {
		return [];
	}
	const range = nodes[ 0 ].node.ownerDocument.createRange();
	range.setStart( nodes[ 0 ].node, 0 );
	range.setEnd( end.node, offset - end.start );
	return Array.from( range.getClientRects() );
}

/**
 * Measures the height of a single line of the content, taken from the
 * smallest step between the line boxes the text lays out on.
 *
 * The step between two lines of the same paragraph is the line height. Steps
 * that cross a paragraph boundary carry the margin between them as well, so
 * the smallest step is the one to trust.
 *
 * @param nodes  Text nodes in document order.
 * @param length Total character count across `nodes`.
 */
function measureLineHeight( nodes: TextNodeEntry[], length: number ): number {
	const rects = lineRects( nodes, length );
	let smallest = Infinity;
	for ( let index = 1; index < rects.length; index++ ) {
		const step = rects[ index ].top - rects[ index - 1 ].top;
		if ( step > 0 ) {
			smallest = Math.min( smallest, step );
		}
	}
	if ( Number.isFinite( smallest ) ) {
		return smallest;
	}
	// A single line of text has no step to measure.
	return rects[ 0 ]?.height ?? 0;
}

/**
 * Reports whether the first `offset` characters of `nodes` lay out entirely
 * above `maxBottom`.
 *
 * @param nodes     Text nodes in document order.
 * @param offset    Number of leading characters to measure.
 * @param maxBottom Viewport-relative bottom edge the text must stay above.
 */
function fitsWithin(
	nodes: TextNodeEntry[],
	offset: number,
	maxBottom: number
): boolean {
	if ( offset === 0 ) {
		return true;
	}

	/*
	 * A range spans one rect per line box, so the lowest bottom edge is the
	 * bottom of the last line the text occupies.
	 */
	let bottom = -Infinity;
	for ( const rect of lineRects( nodes, offset ) ) {
		bottom = Math.max( bottom, rect.bottom );
	}
	// Sub-pixel layout means an exact comparison rejects text that does fit.
	return bottom === -Infinity || bottom <= maxBottom + 0.5;
}

/**
 * Finds the largest number of leading characters that still lays out above
 * `maxBottom`.
 *
 * @param nodes     Text nodes in document order.
 * @param length    Total character count across `nodes`.
 * @param maxBottom Viewport-relative bottom edge the text must stay above.
 */
function findCutOffset(
	nodes: TextNodeEntry[],
	length: number,
	maxBottom: number
): number {
	let low = 0;
	let high = length;
	while ( low < high ) {
		const middle = Math.ceil( ( low + high ) / 2 );
		if ( fitsWithin( nodes, middle, maxBottom ) ) {
			low = middle;
		} else {
			high = middle - 1;
		}
	}
	return low;
}

/**
 * Moves a cut back to the end of the last whole word, so the collapsed note
 * never ends mid-word.
 *
 * @param text Full text of the content.
 * @param cut  Character offset to move back from.
 */
function toWordBoundary( text: string, cut: number ): number {
	if ( cut >= text.length || /\s/.test( text.charAt( cut ) ) ) {
		return cut;
	}
	const match = /\s\S*$/.exec( text.slice( 0, cut ) );
	return match ? match.index : cut;
}

/**
 * Removes text nodes past `cut`, then prunes the elements left holding
 * nothing, and marks the cut with an ellipsis.
 *
 * @param root Element to trim in place.
 * @param cut  Character offset to trim at.
 */
function trimToOffset( root: HTMLElement, cut: number ): boolean {
	const { nodes } = collectTextNodes( root );
	let lastKept: Text | undefined;

	for ( const { node, start } of nodes ) {
		if ( start >= cut ) {
			node.remove();
			continue;
		}
		if ( start + node.data.length > cut ) {
			node.data = node.data.slice( 0, cut - start );
		}
		if ( node.data !== '' ) {
			lastKept = node;
		}
	}

	if ( ! lastKept ) {
		return false;
	}

	// Line breaks past the cut would otherwise add empty lines of their own.
	for ( const separator of Array.from( root.querySelectorAll( 'br, hr' ) ) ) {
		/*
		 * A text node and a `br` can never contain one another, so the
		 * comparison is a plain before-or-after and needs no masking.
		 */
		if (
			lastKept.compareDocumentPosition( separator ) ===
			Node.DOCUMENT_POSITION_FOLLOWING
		) {
			separator.remove();
		}
	}

	// Prune inside out so a wrapper emptied by its children goes too.
	let pruned = true;
	while ( pruned ) {
		pruned = false;
		for ( const element of Array.from( root.querySelectorAll( '*' ) ) ) {
			if (
				! VOID_TAGS.has( element.tagName ) &&
				! element.hasChildNodes()
			) {
				element.remove();
				pruned = true;
			}
		}
	}

	lastKept.data = lastKept.data.replace( /\s+$/, '' ) + ELLIPSIS;
	return true;
}

/**
 * Truncates an element's rendered content to the height it is clamped to,
 * returning the truncated markup.
 *
 * The element is measured and trimmed in place, so it must already be laid
 * out in its collapsed state. Returns `null` when the content already fits,
 * or when nothing at all fits and the caller is better off leaving the
 * content alone for the CSS clamp to handle.
 *
 * @param element Element holding the full rendered content.
 */
export function truncateToFit( element: HTMLElement ): string | null {
	const fullHTML = element.innerHTML;
	const { nodes, text } = collectTextNodes( element );
	if ( ! nodes.length ) {
		return null;
	}

	// Pin the clamp to real line boxes before measuring anything against it.
	const lineHeight = measureLineHeight( nodes, text.length );
	if ( lineHeight > 0 ) {
		element.style.setProperty(
			COLLAPSED_HEIGHT_PROPERTY,
			`${ COLLAPSED_LINES * lineHeight }px`
		);
	}

	if ( element.scrollHeight <= element.clientHeight ) {
		return null;
	}

	const maxBottom =
		element.getBoundingClientRect().top + element.clientHeight;
	let cut = toWordBoundary(
		text,
		findCutOffset( nodes, text.length, maxBottom )
	);

	/*
	 * The measurement above does not know about the ellipsis that replaces the
	 * cut, so the mark itself can push the last line over. Confirm against the
	 * real layout and drop a word at a time until it fits.
	 */
	let trimmed: string | null = null;
	for ( let step = 0; step < MAX_BACKOFF_STEPS; step++ ) {
		element.innerHTML = fullHTML;
		if ( ! trimToOffset( element, cut ) ) {
			break;
		}
		trimmed = element.innerHTML;
		if ( element.scrollHeight <= element.clientHeight || cut <= 0 ) {
			break;
		}
		// A single unbroken word has no boundary to fall back to.
		const match = /\s\S*$/.exec( text.slice( 0, cut ) );
		cut = match ? match.index : cut - 1;
	}

	if ( trimmed === null ) {
		// Not even one word fits, so leave the clamp to do what it can.
		element.innerHTML = fullHTML;
		return null;
	}

	/*
	 * The last trim is kept even if the ellipsis nudged it over the clamp. The
	 * clamp still hides the overflow, and what matters is that nothing past
	 * the cut is left in the DOM to take focus or reach a screen reader.
	 */
	return trimmed;
}
