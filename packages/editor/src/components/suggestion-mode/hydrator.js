/**
 * Seeds the suggestion overlay from persisted `_wp_suggestion` comment
 * payloads on editor mount and whenever the comment list updates. Two
 * scenarios depend on this:
 *
 *   - A suggester reloads the page after auto-save fired. The in-memory
 *     overlay (see `overlay-context.js`) starts empty, but the persisted
 *     note carries the proposed values — without re-seeding, the inline
 *     diff marks disappear until the suggestion is accepted or rejected.
 *   - A reviewer (post author, admin) opens the same post in any intent.
 *     They never wrote the suggestion themselves, so their local overlay is
 *     empty too; without seeding, they only see the sidebar summary, never
 *     the inline strike-through/insertion on the canvas.
 *
 * The hydrator reuses the existing `useNoteThreads` hook from the collab
 * sidebar so the entity-records query (and its cache) is shared — no extra
 * REST traffic, no risk of the two consumers diverging on what counts as a
 * note thread.
 *
 * Live editing wins over hydration: if an entry already exists for a block
 * and was *not* sourced from the hydrator, the seed is skipped. That way a
 * suggester typing into a block whose previous suggestion was persisted
 * doesn't have their unsaved overlay clobbered by a refresh of the comment
 * list.
 */

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { parseSuggestionPayload } from './provider';
import { useNoteThreads } from '../collab-sidebar/hooks';
import { store as editorStore } from '../../store';

/**
 * Shallow equality over two flat objects of primitive-ish values. The
 * hydrator uses this to avoid re-dispatching `SEED_FROM_COMMENT` on every
 * render when the persisted payload hasn't actually moved — the reducer
 * would otherwise mint a new state reference each time and the effect would
 * loop. Strings, numbers, booleans, null, and undefined compare by value;
 * non-primitive values (object attribute payloads like `style`) fall back to
 * reference equality. That matches the suggestion payload shape today —
 * `attribute-set` ops carry primitive or string-serialized values.
 *
 * @param {Object} a First object.
 * @param {Object} b Second object.
 * @return {boolean} True when both objects have the same keys and matching values.
 */
function shallowEqual( a, b ) {
	if ( a === b ) {
		return true;
	}
	if ( ! a || ! b ) {
		return false;
	}
	const ak = Object.keys( a );
	const bk = Object.keys( b );
	if ( ak.length !== bk.length ) {
		return false;
	}
	for ( const k of ak ) {
		if ( a[ k ] !== b[ k ] ) {
			return false;
		}
	}
	return true;
}

/**
 * Derive baseline + overlay attribute pairs from a parsed payload's
 * `attribute-set` operations. Structural ops (`block-remove`,
 * `block-insert-after`, `block-move`) are already rendered via the block's
 * own `metadata.suggestion` marker on the live canvas, so the hydrator
 * skips them — including them here would re-do work that the structural
 * BlockListBlock filter already handles.
 *
 * @param {{ operations: Array<{type: string, attribute?: string, before?: *, after?: *}> }|null} payload
 * @return {{ baselineAttributes: Object, overlayAttributes: Object }|null} Pair
 * suitable for `SEED_FROM_COMMENT`, or null when the payload carries no
 * attribute-set ops.
 */
function attributePairsFromPayload( payload ) {
	if ( ! payload || ! Array.isArray( payload.operations ) ) {
		return null;
	}
	const baselineAttributes = {};
	const overlayAttributes = {};
	let count = 0;
	for ( const op of payload.operations ) {
		if (
			op?.type !== 'attribute-set' ||
			typeof op.attribute !== 'string'
		) {
			continue;
		}
		baselineAttributes[ op.attribute ] = op.before;
		overlayAttributes[ op.attribute ] = op.after;
		count++;
	}
	if ( count === 0 ) {
		return null;
	}
	return { baselineAttributes, overlayAttributes };
}

/**
 * Mounted once inside `SuggestionOverlayProvider`. Watches the post's note
 * threads and seeds an overlay entry for any unresolved (`status: 'hold'`)
 * suggestion whose payload carries an `attribute-set` operation. Re-runs
 * whenever the thread list or block tree changes so a newly-loaded
 * suggestion (or a hot-reloaded block tree) ends up reflected.
 */
export default function SuggestionOverlayHydrator() {
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);
	const { unresolvedNotes } = useNoteThreads( postId );
	const { entries, seedFromComment, clearOverlay } = useSuggestionOverlay();

	useEffect( () => {
		const threads = unresolvedNotes ?? [];

		// Inverse of seeding: drop any hydrator-sourced entry whose note is no
		// longer in the unresolved set. This is the cleanup path for a
		// suggestion that was accepted or rejected in another tab or by a
		// collaborator — the note flips out of `hold` status and leaves
		// `unresolvedNotes`, so its inline marks must be removed even though
		// the block itself still exists. (The orphan prune in
		// `overlay-context.js` only fires when a *block* is removed.) Only
		// entries flagged `hydratedFromCommentId` are pruned; a purely local,
		// in-progress suggestion has no such flag and is never touched here.
		const unresolvedIds = new Set( threads.map( ( thread ) => thread.id ) );
		for ( const [ clientId, entry ] of Object.entries( entries ) ) {
			if (
				entry?.hydratedFromCommentId &&
				! unresolvedIds.has( entry.hydratedFromCommentId )
			) {
				clearOverlay( clientId );
			}
		}

		if ( threads.length === 0 ) {
			return;
		}
		for ( const thread of threads ) {
			const clientId = thread.blockClientId;
			if ( ! clientId ) {
				continue;
			}
			const payload = parseSuggestionPayload(
				thread.meta?._wp_suggestion
			);
			if ( ! payload ) {
				continue;
			}
			const pairs = attributePairsFromPayload( payload );
			if ( ! pairs ) {
				continue;
			}
			const existing = entries[ clientId ];
			// Don't clobber a live overlay that wasn't itself sourced from
			// the hydrator — the suggester may be mid-edit and the in-memory
			// state is more current than the persisted comment.
			if (
				existing &&
				existing.hydratedFromCommentId !== thread.id &&
				Object.keys( existing.overlayAttributes ?? {} ).length > 0
			) {
				continue;
			}
			// Already hydrated from this comment and the persisted values
			// haven't changed — no-op rather than re-dispatching. The reducer
			// would otherwise produce a new state reference on every render,
			// looping the effect indefinitely.
			if (
				existing &&
				existing.hydratedFromCommentId === thread.id &&
				shallowEqual(
					existing.baselineAttributes,
					pairs.baselineAttributes
				) &&
				shallowEqual(
					existing.overlayAttributes,
					pairs.overlayAttributes
				)
			) {
				continue;
			}
			seedFromComment(
				clientId,
				payload.blockName ?? null,
				thread.id,
				pairs.baselineAttributes,
				pairs.overlayAttributes,
				// The comment author id tints the inline diff marks with the
				// suggester's color instead of the current viewer's. `author`
				// is the numeric user id on the comment record; fall back to
				// null for guest authors so the marks use the default palette.
				thread.author ?? null
			);
		}
	}, [ unresolvedNotes, entries, seedFromComment, clearOverlay ] );

	return null;
}
