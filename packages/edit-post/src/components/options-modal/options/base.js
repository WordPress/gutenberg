/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';

const BaseOption = ( { label, isChecked, onChange } ) => (
	<CheckboxControl
		className="edit-post-options-modal__option"
		label={ label }
		checked={ isChecked }
		onChange={ onChange }
	/>
);

export default BaseOption;
