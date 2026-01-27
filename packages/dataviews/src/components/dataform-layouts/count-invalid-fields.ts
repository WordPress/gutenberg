/**
 * Internal dependencies
 */
import type { FieldValidity } from '../../types';

/**
 * Recursively counts the number of invalid fields in a validity tree.
 *
 * @param validity The field validity object to inspect.
 * @return The total number of invalid fields.
 */
export default function countInvalidFields(
	validity: FieldValidity | undefined
): number {
	if ( ! validity ) {
		return 0;
	}

	let count = 0;
	const validityRules = Object.keys( validity ).filter(
		( key ) => key !== 'children'
	);

	for ( const key of validityRules ) {
		const rule = validity[ key as keyof Omit< FieldValidity, 'children' > ];
		if ( rule?.type === 'invalid' ) {
			count++;
		}
	}

	// Count children recursively
	if ( validity.children ) {
		for ( const childValidity of Object.values( validity.children ) ) {
			count += countInvalidFields( childValidity );
		}
	}

	return count;
}
