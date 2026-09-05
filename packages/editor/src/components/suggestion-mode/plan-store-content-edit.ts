import { planEditMarkers } from '../inline-suggestions';

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
