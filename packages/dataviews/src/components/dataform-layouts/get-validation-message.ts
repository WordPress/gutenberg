import { sprintf, _n } from '@wordpress/i18n';
import type { FieldValidity } from '../../types';

function countInvalidFields( validity: FieldValidity | undefined ): number {
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

/**
 * Summarizes how many fields need attention, or `undefined` when they are
 * all valid. Used both as the visible badge text and as the message announced
 * to assistive technology when a layout reveals its errors.
 *
 * @param validity The validity of the layout's field and its children.
 */
export default function getValidationMessage(
	validity: FieldValidity | undefined
): string | undefined {
	const invalidCount = countInvalidFields( validity );

	if ( invalidCount === 0 ) {
		return undefined;
	}

	return sprintf(
		/* translators: %d: Number of fields that need attention */
		_n(
			'%d field needs attention',
			'%d fields need attention',
			invalidCount
		),
		invalidCount
	);
}
