/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function PreferencesModalToggle( {
	help,
	label,
	isChecked,
	onChange,
	children,
} ) {
	return (
		<div className="interface-preferences-modal-toggle">
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
