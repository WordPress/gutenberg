/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormToggle from '../';

export default { title: 'Form Toggle', component: FormToggle };

export const _default = () => {
	const [ isChecked, setChecked ] = useState( true );
	return (
		<FormToggle
			checked={ isChecked }
			onChange={
				() => {
					setChecked( ! isChecked );
				}
			}
		/>
	);
};
