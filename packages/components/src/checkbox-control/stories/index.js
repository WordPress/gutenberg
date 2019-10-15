/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CheckboxControl from '../';

export default { title: 'Checkbox Control', component: CheckboxControl };

export const _default = () => {
	const [ isChecked, setChecked ] = useState( true );
	return (
		<CheckboxControl
			heading="User"
			label="Is author"
			help="Is the user a author or not?"
			checked={ isChecked }
			onChange={ setChecked }
		/>
	);
};
