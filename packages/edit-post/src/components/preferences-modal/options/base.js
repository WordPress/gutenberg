/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

function BaseOption( { help, label, isChecked, onChange, children } ) {
	return (
		<div className="edit-post-preferences-modal__option">
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
