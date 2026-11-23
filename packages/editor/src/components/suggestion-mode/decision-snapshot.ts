/**
 * What a suggestion said when it was decided.
 *
 * An inline suggestion's text lives in its marker, and an inserted block's
 * in the block. A decision removes one or the other, so the note would be
 * left with nothing to name the change by. The text is copied into the
 * payload as the decision is recorded, for the summary to fall back on.
 */
import {
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_REPLACEMENT,
	findSuggestionText,
} from '../inline-suggestions';
import { findInlineMarker } from './anchor-index';
import { INLINE_OP_TYPE, blockExcerpt, findBlockByNoteId } from './operations';
import type { SuggestionOperation, SuggestionPayload } from './operations';

/** Longest marker text a payload keeps, in characters. */
export const DECIDED_TEXT_MAX_CHARS = 1000;

function clamp( text: string ): string {
	// Cut between characters, never inside a surrogate pair.
	const characters = Array.from( text );
	return characters.length <= DECIDED_TEXT_MAX_CHARS
		? text
		: `${ characters.slice( 0, DECIDED_TEXT_MAX_CHARS - 1 ).join( '' ) }…`;
}

/**
 * The payload with the text its suggestion currently shows recorded on it.
 *
 * @param blockEditor Block editor selectors.
 * @param commentId   The note.
 * @param payload     Its payload.
 * @return The payload to store, or null when there is nothing to record.
 */
export function snapshotDecidedPayload(
	blockEditor: any,
	commentId: number | string,
	payload: SuggestionPayload | null | undefined
): SuggestionPayload | null {
	if ( ! payload || ! Array.isArray( payload.operations ) ) {
		return null;
	}
	let changed = false;
	const operations = payload.operations.map( ( op: SuggestionOperation ) => {
		if ( op.type === INLINE_OP_TYPE && op.suggestionType !== 'format' ) {
			const target = findInlineMarker( blockEditor, commentId, {
				attribute: op.attribute,
			} );
			const value = target
				? blockEditor.getBlockAttributes( target.clientId )?.[
						target.attribute
					]
				: undefined;
			if ( value === undefined ) {
				return op;
			}
			const isReplacement =
				op.suggestionType === SUGGESTION_TYPE_REPLACEMENT;
			const text = findSuggestionText(
				value,
				commentId,
				isReplacement ? SUGGESTION_TYPE_ADDITION : undefined
			);
			const deletedText = isReplacement
				? findSuggestionText(
						value,
						commentId,
						SUGGESTION_TYPE_DELETION
					)
				: '';
			if ( ! text && ! deletedText ) {
				return op;
			}
			changed = true;
			return {
				...op,
				...( text && { decidedText: clamp( text ) } ),
				...( deletedText && {
					decidedDeletedText: clamp( deletedText ),
				} ),
			};
		}
		if ( op.type === 'block-insert-after' ) {
			const clientId = findBlockByNoteId(
				blockEditor.getClientIdsWithDescendants?.() ?? [],
				blockEditor.getBlockAttributes,
				commentId
			);
			const { excerpt } = blockExcerpt(
				clientId ? blockEditor.getBlock?.( clientId ) : null
			);
			if ( excerpt && excerpt !== op.excerpt ) {
				changed = true;
				return { ...op, excerpt };
			}
		}
		return op;
	} );
	return changed ? { ...payload, operations } : null;
}
