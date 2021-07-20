/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

export function useChangeHandlers( onChange: ( value: string ) => void ) {
	const handleOnChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			onChange( event.target.value );
		},
		[ onChange ]
	);

	return { onChange: handleOnChange };
}
