/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormToggle from '../';

export default { title: 'Form Toggle', component: FormToggle };

const Example = () => {
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

export const _default = () => {
	return <Example />;
};
