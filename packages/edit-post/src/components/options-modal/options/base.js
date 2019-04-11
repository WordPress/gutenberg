/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';

function BaseOption( { label, isChecked, onChange } ) {
	return (
		<CheckboxControl
			className="edit-post-options-modal__option"
			label={ label }
			checked={ isChecked }
			onChange={ onChange }
		/>
	);
}

export default BaseOption;
