/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';

function BaseOption( { label, help, isChecked, onChange, children } ) {
	return (
		<div className="edit-post-options-modal__option">
			<CheckboxControl
				label={ label }
				checked={ isChecked }
				onChange={ onChange }
				help={ help }
			/>
			{ children }
		</div>
	);
}

export default BaseOption;
