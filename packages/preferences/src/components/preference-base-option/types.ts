/**
 * WordPress dependencies
 */
import type { ToggleControl } from '@wordpress/components';

/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type ToggleControlProps = Parameters< typeof ToggleControl >[ 0 ];
export type BaseOptionProps = Pick<
	ToggleControlProps,
	'help' | 'label' | 'onChange'
> & { isChecked: ToggleControlProps[ 'checked' ]; children: ReactNode };
