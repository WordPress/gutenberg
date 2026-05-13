/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
/**
 * Internal dependencies
 */
import type { BaseOptionProps } from './types';

function BaseOption( {
	disabled,
	help,
	label,
	isChecked,
	onChange,
	children,
}: BaseOptionProps ) {
	return (
		<div className="preference-base-option">
			<ToggleControl
				disabled={ disabled }
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
