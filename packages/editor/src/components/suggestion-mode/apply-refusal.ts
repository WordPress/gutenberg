/**
 * Why accepting a suggestion's attribute changes is refused, worded for the
 * reviewer. Accept checks before recording a decision, so a refused
 * suggestion stays pending and can still be rejected.
 */
import { __ } from '@wordpress/i18n';
import {
	SUGGEST_CONTENT_META_KEYS,
	SUGGEST_PROPOSABLE_POST_FIELDS,
} from '../../store/constants';
import { isProposedNewTerm } from './create-proposed-terms';
import { markerForNote, proposedAttributes } from './marker';
import {
	findAttributeOperationProblem,
	findInlineOp,
	findStructuralOp,
	proposalMatchesOperations,
} from './operations';
import type { SuggestionOperation, SuggestionPayload } from './operations';

/**
 * The notice for an accept that cannot go ahead, or null when it can. A
 * suggestion that proposes no attribute value has nothing to check here.
 *
 * @param args            Arguments.
 * @param args.blockName  Name of the target block.
 * @param args.attributes The target block's current attributes.
 * @param args.commentId  The suggestion's note.
 * @param args.payload    The suggestion payload.
 * @return The notice, or null.
 */
export function getAttributeApplyRefusal( {
	blockName,
	attributes,
	commentId,
	payload,
}: {
	blockName: string | null | undefined;
	attributes: Record< string, any > | null | undefined;
	commentId: number | string;
	payload: SuggestionPayload;
} ): string | null {
	// An inline suggestion is a marker in the text, and accepting a removal
	// takes the block out: neither applies a value.
	if (
		findInlineOp( payload.operations ) ||
		findStructuralOp( payload.operations )?.type === 'block-remove'
	) {
		return null;
	}
	const attributeOps = payload.operations.filter(
		( op ) => op?.type === 'attribute-set'
	);
	const marker = markerForNote( attributes, commentId );
	const proposal = proposedAttributes( marker );
	if ( attributeOps.length === 0 && ! proposal ) {
		return null;
	}
	if ( ! marker ) {
		return __(
			'This suggestion is no longer in the post. Reject it to close the note.'
		);
	}
	/*
	 * The reviewer reads the proposal off the block and the summary off the
	 * note. When they differ there is no telling which one was accepted.
	 */
	if ( ! proposalMatchesOperations( attributes, proposal, attributeOps ) ) {
		return __(
			'This suggestion no longer matches the post. Reload and try again, or reject it.'
		);
	}
	/*
	 * The values were proposed for the block type the payload names. On
	 * another type the same attribute name can mean something else.
	 */
	if (
		typeof payload.blockName === 'string' &&
		payload.blockName !== blockName
	) {
		return __(
			'This block changed type after the suggestion was made. Reject it to close the note.'
		);
	}
	const problem = findAttributeOperationProblem(
		blockName,
		attributeOps,
		attributes
	);
	if ( ! problem ) {
		return null;
	}
	return problem === 'unsafe-value'
		? __(
				'This suggestion proposes a value that is not allowed here. Reject it to close the note.'
			)
		: __(
				'This suggestion proposes a change this block does not support. Reject it to close the note.'
			);
}

function isId( value: unknown ): boolean {
	return Number.isInteger( value ) && ( value as number ) >= 0;
}

/**
 * Whether a post-level operation names a field that can be suggested and
 * proposes a value of that field's shape.
 *
 * @param op           A `post-attribute-set` operation.
 * @param isProposable Whether a field (or meta key) can be suggested.
 * @return True when accept may apply it.
 */
function isApplicablePostOperation(
	op: SuggestionOperation,
	isProposable: ( attribute: string, key?: string ) => boolean
): boolean {
	const { attribute, key, after } = op;
	if ( typeof attribute !== 'string' ) {
		return false;
	}
	if ( attribute === 'meta' ) {
		return (
			typeof key === 'string' &&
			key !== '' &&
			// Written by the block sync, never proposed.
			! ( SUGGEST_CONTENT_META_KEYS as readonly string[] ).includes(
				key
			) &&
			isProposable( 'meta', key )
		);
	}
	if ( ! isProposable( attribute ) ) {
		return false;
	}
	if ( after === null || after === undefined ) {
		return true;
	}
	if ( attribute === 'featured_media' ) {
		return isId( after );
	}
	if (
		( SUGGEST_PROPOSABLE_POST_FIELDS as readonly string[] ).includes(
			attribute
		)
	) {
		return typeof after === 'string';
	}
	// A taxonomy: term ids, and terms to create on accept.
	return (
		Array.isArray( after ) &&
		after.every( ( term ) => isId( term ) || isProposedNewTerm( term ) )
	);
}

/**
 * The notice for a post-level accept that cannot go ahead, or null when it
 * can. The server holds a note's post-level operations to the same list when
 * the note is written over REST; this is the check on the side that edits
 * the post, whatever wrote the note.
 *
 * @param postOps      The payload's `post-attribute-set` operations.
 * @param isProposable Whether a field (or meta key) can be suggested.
 * @return The notice, or null.
 */
export function getPostApplyRefusal(
	postOps: SuggestionOperation[],
	isProposable: ( attribute: string, key?: string ) => boolean
): string | null {
	return postOps.every( ( op ) =>
		isApplicablePostOperation( op, isProposable )
	)
		? null
		: __(
				'This suggestion changes a post setting that cannot be suggested. Reject it to close the note.'
			);
}
