import { OPERATOR_IS, OPERATOR_IS_ANY } from '../constants';
import type { NormalizedFilter } from '../types';

type SelectionOperator = typeof OPERATOR_IS | typeof OPERATOR_IS_ANY;

/**
 * Returns the operator to filter a field with when the user only picks among
 * its options, with no control to choose an operator: `is` to pick one value,
 * or `isAny` to pick several. It is the first of the two that the field
 * lists, as when a filter is added from the filters UI.
 *
 * @param filter The filter of the field.
 * @return The operator, or `undefined` when the field supports neither.
 */
export default function getSelectionOperator(
	filter: Pick< NormalizedFilter, 'operators' >
): SelectionOperator | undefined {
	return filter.operators.find(
		( operator ): operator is SelectionOperator =>
			operator === OPERATOR_IS || operator === OPERATOR_IS_ANY
	);
}
