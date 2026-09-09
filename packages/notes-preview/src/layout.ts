/**
 * Vertical placement for the thread cards in the review rail.
 *
 * Cards want to sit level with the thing they are about, the way a margin
 * comment does in Google Docs, but two notes on adjacent paragraphs would
 * overlap. The selected card is pinned exactly to its anchor and the rest are
 * pushed away from it, so the card you are reading is always the one that is
 * correctly aligned.
 *
 * Pure and document-space, so it can be unit tested without a DOM and so the
 * caller can translate the whole board on scroll rather than recomputing.
 */

export interface ThreadAnchor {
	/** Note ID, as a string, matching the card's `data-note-id`. */
	id: string;
	/** Document-space top of the anchor element. */
	top: number;
}

export interface LayoutOptions {
	/** Anchors in any order; sorted by `top` internally. */
	anchors: ThreadAnchor[];
	/** Measured card heights, keyed by note ID. */
	heights: Record< string, number >;
	/** Note ID of the selected thread, if any. */
	selectedId?: string | null;
	/** Minimum vertical space between two cards. */
	gap?: number;
	/** Nudge applied so a card's first line sits level with its anchor. */
	alignOffset?: number;
}

export const DEFAULT_GAP = 12;
export const DEFAULT_ALIGN_OFFSET = -4;

/**
 * Places each thread card in document space.
 *
 * @param options             Layout options.
 * @param options.anchors
 * @param options.heights
 * @param options.selectedId
 * @param options.gap
 * @param options.alignOffset
 * @return Document-space top for each note ID.
 */
export function calculateThreadTops( {
	anchors,
	heights,
	selectedId = null,
	gap = DEFAULT_GAP,
	alignOffset = DEFAULT_ALIGN_OFFSET,
}: LayoutOptions ): Record< string, number > {
	const tops: Record< string, number > = {};

	if ( ! anchors.length ) {
		return tops;
	}

	const ordered = [ ...anchors ].sort( ( a, b ) => a.top - b.top );

	// The selected card is the one that gets to be exactly right; everything
	// else gives way to it. With nothing selected the topmost card holds that
	// position, so the page reads top-down.
	const anchorIndex = Math.max(
		0,
		ordered.findIndex( ( anchor ) => anchor.id === selectedId )
	);

	const pinned = ordered[ anchorIndex ];
	tops[ pinned.id ] = pinned.top + alignOffset;

	// Downward: a card may sit at its anchor unless that would collide with
	// the card above it, in which case it follows on directly.
	let previousTop = tops[ pinned.id ];
	let previousHeight = heights[ pinned.id ] ?? 0;

	for ( let i = anchorIndex + 1; i < ordered.length; i++ ) {
		const { id, top } = ordered[ i ];
		const placed = Math.max(
			top + alignOffset,
			previousTop + previousHeight + gap
		);

		tops[ id ] = placed;
		previousTop = placed;
		previousHeight = heights[ id ] ?? 0;
	}

	// Upward: the mirror image, walking back towards the top of the page.
	let nextTop = tops[ pinned.id ];

	for ( let i = anchorIndex - 1; i >= 0; i-- ) {
		const { id, top } = ordered[ i ];
		const height = heights[ id ] ?? 0;
		const placed = Math.min( top + alignOffset, nextTop - gap - height );

		tops[ id ] = placed;
		nextTop = placed;
	}

	return tops;
}

/**
 * Splits a `data-wp-note-id` attribute into note IDs.
 *
 * A block can carry several notes, in which case the attribute is a comma
 * separated list.
 *
 * @param value Raw attribute value.
 * @return Note IDs, as strings, with blanks dropped.
 */
export function parseNoteIds( value: string | null ): string[] {
	if ( ! value ) {
		return [];
	}

	return value
		.split( ',' )
		.map( ( id ) => id.trim() )
		.filter( ( id ) => /^\d+$/.test( id ) );
}
