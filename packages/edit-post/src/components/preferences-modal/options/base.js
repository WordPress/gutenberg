/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';

function BaseOption( { label, isChecked, onChange, children } ) {
	return (
		<div className="edit-post-preferences-modal__option">
			<CheckboxControl
				label={ label }
				checked={ isChecked }
				onChange={ onChange }
			/>
			{ children }
		</div>
	);
}

export default BaseOption;
