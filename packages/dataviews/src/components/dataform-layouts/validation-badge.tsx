/**
 * WordPress dependencies
 */
import { Badge } from '@wordpress/ui';
import { sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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

export default function ValidationBadge( {
	validity,
}: {
	validity: FieldValidity | undefined;
} ) {
	const invalidCount = countInvalidFields( validity );

	if ( invalidCount === 0 ) {
		return null;
	}

	return (
		<Badge intent="high">
			{ sprintf(
				/* translators: %d: Number of fields that need attention */
				_n(
					'%d field needs attention',
					'%d fields need attention',
					invalidCount
				),
				invalidCount
			) }
		</Badge>
	);
}
