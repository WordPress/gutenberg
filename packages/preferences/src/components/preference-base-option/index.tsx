/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
/**
 * Internal dependencies
 */
import type { BaseOptionProps } from './types';

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
