/**
 * WordPress dependencies
 */
import type { ToggleControl } from '@wordpress/components';

type ToggleControlProps = Parameters< typeof ToggleControl >[ 0 ];
export type BaseOptionProps = Pick<
	ToggleControlProps,
	'help' | 'label' | 'onChange'
> & { isChecked?: ToggleControlProps[ 'checked' ]; children?: React.ReactNode };
