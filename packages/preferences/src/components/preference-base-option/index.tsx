/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type ToggleControlProps = Parameters< typeof ToggleControl >[ 0 ];
export type BaseOptionProps = Pick<
	ToggleControlProps,
	'help' | 'label' | 'onChange'
> & { isChecked: ToggleControlProps[ 'checked' ]; children: ReactNode };

function BaseOption( {
	help,
	label,
	isChecked,
	onChange,
	children,
}: BaseOptionProps ) {
	return (
		<div className="preference-base-option">
			<ToggleControl
				__nextHasNoMarginBottom
				help={ help }
				label={ label }
				checked={ isChecked }
				onChange={ onChange }
			/>
			{ children }
		</div>
	);
}

export default BaseOption;
