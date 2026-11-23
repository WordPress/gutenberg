/**
 * Why accepting a suggestion's attribute changes is refused, worded for the
 * reviewer. Accept checks before recording a decision, so a refused
 * suggestion stays pending and can still be rejected.
 */
import { __ } from '@wordpress/i18n';
import { findAttributeOperationProblem } from './operations';
import type { SuggestionPayload } from './operations';

/**
 * The notice for an accept that cannot go ahead, or null when it can. A
 * payload that sets no attribute has nothing to check here.
 *
 * @param args            Arguments.
 * @param args.blockName  Name of the target block.
 * @param args.attributes The target block's current attributes.
 * @param args.payload    The suggestion payload.
 * @return The notice, or null.
 */
export function getAttributeApplyRefusal( {
	blockName,
	attributes,
	payload,
}: {
	blockName: string | null | undefined;
	attributes: Record< string, any > | null | undefined;
	payload: SuggestionPayload;
} ): string | null {
	if ( ! payload.operations.some( ( op ) => op?.type === 'attribute-set' ) ) {
		return null;
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
		payload.operations,
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
