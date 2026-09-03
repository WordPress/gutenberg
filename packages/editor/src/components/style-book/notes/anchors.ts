import { __ } from '@wordpress/i18n';
import type { BlockExample } from '../types';

/**
 * Comment meta key holding the Style Book example a note was left on.
 */
export const NOTE_ANCHOR_META = '_wp_note_anchor';

/**
 * Bucket for notes whose anchor no longer matches a rendered example - a
 * deactivated block plugin, a renamed example, a note left under a theme that
 * registers blocks the current one does not. Such notes are surfaced rather
 * than dropped, so nobody's feedback disappears silently.
 */
export const UNKNOWN_ANCHOR = '__unknown__';

export type StyleBookNoteThread = {
	id: number;
	status: string;
	parent?: number;
	meta?: Record< string, unknown >;
	[ key: string ]: unknown;
};

export type StyleBookNoteGroup = {
	anchor: string;
	label: string;
	threads: StyleBookNoteThread[];
};

/**
 * Reads the anchor a note was left on.
 *
 * The meta is a free-form string on the server, so anything that is not a
 * non-empty string is treated as no anchor at all.
 *
 * @param thread Note thread, if there is one.
 * @return The anchor, or an empty string when the note carries none.
 */
export function getThreadAnchor(
	thread: StyleBookNoteThread | undefined
): string {
	const anchor = thread?.meta?.[ NOTE_ANCHOR_META ];

	return typeof anchor === 'string' ? anchor : '';
}

/**
 * Builds a lookup from example name to the title the Style Book displays for
 * it.
 *
 * The titles come from the examples themselves rather than from block type
 * titles, because the Style Book overrides some of them - `core/heading`
 * renders as "Headings", not "Heading" - and adds synthetic examples such as
 * `typography` that no block type covers.
 *
 * @param examples Style Book examples.
 * @return Example name to display title.
 */
export function getAnchorLabels(
	examples: Array< Pick< BlockExample, 'name' | 'title' > >
): Record< string, string > {
	const labels: Record< string, string > = {};

	for ( const example of examples ) {
		// Examples can repeat across categories under the same name; the first
		// one wins, matching how the Style Book dedupes for single-page use.
		if ( example?.name && ! ( example.name in labels ) ) {
			labels[ example.name ] = example.title;
		}
	}

	return labels;
}

/**
 * Groups note threads under the Style Book example each was left on.
 *
 * Anchors with no matching example - and notes with no anchor at all, which a
 * future client could write - collapse into a single unknown bucket so they
 * stay visible without pretending to point at a section that is not on screen.
 *
 * Groups follow the order of `labels`, which is the order the Style Book
 * renders its examples in, so the sidebar reads top to bottom like the canvas.
 * The unknown bucket always sorts last.
 *
 * @param threads Root note threads.
 * @param labels  Example name to display title.
 * @return Ordered groups of threads.
 */
export function groupThreadsByAnchor(
	threads: StyleBookNoteThread[],
	labels: Record< string, string >
): StyleBookNoteGroup[] {
	const byAnchor = new Map< string, StyleBookNoteThread[] >();

	for ( const thread of threads ) {
		const anchor = getThreadAnchor( thread );
		const key = anchor && anchor in labels ? anchor : UNKNOWN_ANCHOR;
		if ( ! byAnchor.has( key ) ) {
			byAnchor.set( key, [] );
		}
		byAnchor.get( key )!.push( thread );
	}

	const groups: StyleBookNoteGroup[] = [];

	for ( const anchor of Object.keys( labels ) ) {
		const anchored = byAnchor.get( anchor );
		if ( anchored ) {
			groups.push( {
				anchor,
				label: labels[ anchor ],
				threads: anchored,
			} );
		}
	}

	const unknown = byAnchor.get( UNKNOWN_ANCHOR );
	if ( unknown ) {
		groups.push( {
			anchor: UNKNOWN_ANCHOR,
			label: __( 'Other notes' ),
			threads: unknown,
		} );
	}

	return groups;
}

/**
 * Counts the threads left on each example, for the per-example badges.
 *
 * Threads with an unrecognised anchor are left out: no example is on screen to
 * carry their count.
 *
 * @param threads Root note threads.
 * @return Example name to thread count.
 */
export function countThreadsByAnchor(
	threads: StyleBookNoteThread[]
): Record< string, number > {
	const counts: Record< string, number > = {};

	for ( const thread of threads ) {
		const anchor = getThreadAnchor( thread );
		if ( anchor ) {
			counts[ anchor ] = ( counts[ anchor ] ?? 0 ) + 1;
		}
	}

	return counts;
}
