/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '.';

export function useBaseControlProps( {
	help,
	preferredId,
}: {
	/** The `help` value to pass to the BaseControl. */
	help: ReactNode;
	/** Optionally specify an explicit `id`. If you do this, you are responsible for ensuring its uniqueness. */
	preferredId?: string;
} ) {
	const uniqueId = useInstanceId(
		BaseControl,
		'components-base-control',
		preferredId
	);

	// ARIA descriptions can only contain plain text, so fall back to aria-details if not.
	const helpPropName =
		typeof help === 'string' ? 'aria-describedby' : 'aria-details';
	const helpProp = !! help ? { [ helpPropName ]: `${ uniqueId }__help` } : {};

	return {
		baseControlProps: {
			id: uniqueId,
			help,
		},
		controlProps: {
			id: uniqueId,
			...helpProp,
		},
	};
}
