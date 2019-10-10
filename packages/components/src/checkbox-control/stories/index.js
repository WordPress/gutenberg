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
	const [ isChecked, setState ] = useState( true );
	return (
		<CheckboxControl
			label="Allow Comments"
			help="Allow comments on post or not?"
			checked={ isChecked }
			onChange={ ( val ) => setState( val ) }
		/>
	);
};
