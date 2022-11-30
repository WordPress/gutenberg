/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '.';
import type { BaseControlProps } from './types';

export function useBaseControlProps( {
	help,
	id: preferredId,
	...restProps
}: Omit< BaseControlProps, 'children' > ) {
	const uniqueId = useInstanceId(
		BaseControl,
		'wp-components-base-control',
		preferredId
	);

	// ARIA descriptions can only contain plain text, so fall back to aria-details if not.
	const helpPropName =
		typeof help === 'string' ? 'aria-describedby' : 'aria-details';

	return {
		baseControlProps: {
			id: uniqueId,
			help,
			...restProps,
		},
		controlProps: {
			id: uniqueId,
			...( !! help ? { [ helpPropName ]: `${ uniqueId }__help` } : {} ),
		},
	};
}
