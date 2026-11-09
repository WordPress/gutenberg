import { RichTextData, remove } from '@wordpress/rich-text';
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_ID_ATTRIBUTE,
	analyzeTextEdit,
	isSuggestionFormat,
	planEditMarkers,
	suggestionMarkersAt,
} from '../inline-suggestions';
import { toRichTextRecord } from '../inline-suggestions/rich-text-record';

/**
 * True for plain strings and for objects that stringify to a meaningful HTML
 * form (the rich-text package's `RichTextData` is the case we care about).
 * Duck-typed against `toString` rather than `instanceof RichTextData` so this
 * module doesn't take a hard dependency on the rich-text package's internal
 * class. Mirrors the same check in `with-suggestion-overlay.js`, which can't be
 * imported from here — that module already imports this directory's
 * `store-interceptor`.
 *
 * @param value Candidate attribute value.
 * @return True when `String( value )` will produce useful HTML.
 */
function isStringLike( value: any ): boolean {
	if ( typeof value === 'string' ) {
		return true;
	}
	return (
		value !== null &&
		value !== undefined &&
		typeof value.toString === 'function' &&
		value.toString !== Object.prototype.toString
	);
}

/**
 * Decide whether a store-level attribute change is a plain removal of text from
 * a block's `content` that can be re-expressed as an inline deletion marker.
 *
 * `withSuggestionOverlay` already asks a version of this question for edits that
 * arrive through a block's `setAttributes` prop. The store interceptor sees the
 * other half — changes dispatched straight at the block-editor store — and had
 * no equivalent, so every one of them became a whole-attribute overlay. The
 * splitting Enter is the case that matters (#73411, F-07):
 * `__unstableSplitSelection` dispatches `replaceBlocks` with a truncated head
 * and a new tail block, and the head's truncation reached the overlay. The
 * overlay renders its clean snapshot *in place of* the block's value, so the
 * text proposed for removal simply vanished from the canvas: the split read as
 * already applied rather than as something to review.
 *
 * Removals are the asymmetric case, which is why this is limited to them. When
 * an overlay swallows an insertion the reviewer still sees the proposed text —
 * it is the new value being rendered. When it swallows a removal there is
 * nothing left on screen to review, and the block reads as a completed edit.
 * Insertions and type-overs reaching this seam (a multi-line paste, most
 * notably) keep the overlay capture they have today; converting those is the
 * "reach the fallback less often" work F-09 leaves open.
 *
 * Also narrow in the other axes: only a change whose sole user-visible key is
 * `content` qualifies, and only a plan whose single action opens a fresh note —
 * the bar `SuggestionContentReconciler` can actually execute. Anything else (a
 * mixed attribute change, an edit that would grow or drop an existing marker, a
 * diff the planner can't resolve) returns null and keeps today's behaviour.
 *
 * @param previous   Block attributes before the change.
 * @param current    Block attributes after the change.
 * @param changed    Changed attributes, system metadata already stripped.
 * @param [authorId] Current author id, stamped on new markers.
 * @return The marker plan, or null when the change should keep taking the
 * overlay path.
 */
export function planStoreContentEdit(
	previous: Record< string, any >,
	current: Record< string, any >,
	changed: Record< string, any >,
	authorId?: number | string
) {
	const keys = Object.keys( changed ?? {} );
	if ( keys.length !== 1 || keys[ 0 ] !== 'content' ) {
		return null;
	}
	const prevContent = previous?.content;
	const nextContent = current?.content;
	if ( ! isStringLike( prevContent ) || ! isStringLike( nextContent ) ) {
		return null;
	}
	const plan = planEditMarkers( prevContent, nextContent, { authorId } );
	const actions = plan?.actions ?? [];
	if ( actions.length !== 1 ) {
		return null;
	}
	const [ action ] = actions;
	if ( action.type !== 'wrap-del' || ! action.newNote ) {
		return null;
	}
	return plan;
}

/**
 * Settle the markers inside a store-level removal from a block's `content`
 * before it is planned, so the removal can still become a deletion marker.
 *
 * The splitting Enter is the case (#73411, B8): the head loses everything after
 * the caret, markers included, and `planEditMarkers` won't wrap a `del` marker
 * over a run that already carries one. The whole change then fell back to the
 * overlay, outlining the block and listing it as a whole-content "Replace".
 *
 * - The author's own proposed text in the removed run is retracted: it was
 *   never part of the post, and the split carries it on into the new block, so
 *   it leaves this one outright rather than being proposed for deletion.
 * - Any other marker in the removed run declines the edit. Another author's
 *   suggestion has to be resolved before anyone edits over it, and the
 *   author's own deletion or formatting proposal would move to the new block
 *   as plain text, silently dropping it.
 *
 * @param previous   Block attributes before the change.
 * @param current    Block attributes after the change.
 * @param changed    Changed attributes, system metadata already stripped.
 * @param [authorId] Current author id.
 * @return `null` when the change is not a marked removal from `content`;
 * `{ refuse: true }` when it must be declined; otherwise `{ previous }`, the
 * attributes to plan the removal from, with the retracted text gone, and
 * `withdrawnIds`, the notes whose every marker the removal took.
 */
export function settleStoreContentRemoval(
	previous: Record< string, any >,
	current: Record< string, any >,
	changed: Record< string, any >,
	authorId?: number | string | null
):
	| { refuse: true }
	| {
			refuse?: false;
			previous: Record< string, any >;
			withdrawnIds: string[];
	  }
	| null {
	const keys = Object.keys( changed ?? {} );
	if ( keys.length !== 1 || keys[ 0 ] !== 'content' ) {
		return null;
	}
	const prevContent = previous?.content;
	if ( ! ( prevContent instanceof RichTextData ) ) {
		return null;
	}
	const record = toRichTextRecord( prevContent );
	const nextRecord = toRichTextRecord( current?.content );
	if ( ! record || ! nextRecord ) {
		return null;
	}
	const edit = analyzeTextEdit( record.text, nextRecord.text );
	if ( edit.kind !== 'delete' ) {
		return null;
	}
	const authorToken =
		authorId !== undefined && authorId !== null ? String( authorId ) : '';
	const retract: boolean[] = [];
	const retractedIds = new Set< string >();
	let marked = false;
	for ( let i = edit.start; i < edit.end; i++ ) {
		const stack = record.formats[ i ];
		if ( ! stack?.some( isSuggestionFormat ) ) {
			continue;
		}
		/*
		 * Only the author's own proposed text can be taken back. Another
		 * author's deletion or formatting change nested in it goes with it:
		 * it described text that is no longer proposed.
		 */
		const addition = suggestionMarkersAt( stack ).add;
		const attributes = ( addition?.attributes ?? {} ) as Record<
			string,
			string
		>;
		if (
			! addition ||
			String( attributes[ SUGGESTION_AUTHOR_ATTRIBUTE ] ?? '' ) !==
				authorToken
		) {
			return { refuse: true };
		}
		retract[ i ] = true;
		retractedIds.add( String( attributes[ SUGGESTION_ID_ATTRIBUTE ] ) );
		marked = true;
	}
	if ( ! marked ) {
		return null;
	}
	let settled = record;
	// Last run first, so earlier offsets stay valid as text is removed.
	for ( let end = edit.end; end > edit.start; ) {
		if ( ! retract[ end - 1 ] ) {
			end--;
			continue;
		}
		let start = end - 1;
		while ( start > edit.start && retract[ start - 1 ] ) {
			start--;
		}
		settled = remove( settled, start, end );
		end = start;
	}
	// An addition split partway keeps its note anchored in what stays.
	for ( const stack of nextRecord.formats ) {
		for ( const format of stack ?? [] ) {
			if ( isSuggestionFormat( format ) ) {
				retractedIds.delete(
					String( format.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] )
				);
			}
		}
	}
	return {
		previous: {
			...previous,
			content: new RichTextData( settled as any ),
		},
		withdrawnIds: [ ...retractedIds ],
	};
}
