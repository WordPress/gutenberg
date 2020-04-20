/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormToggle from '../';

export default { title: 'Components/FormToggle', component: FormToggle };

const FormToggleWithState = ( { checked, ...props } ) => {
	const [ isChecked, setChecked ] = useState( checked );
	return (
		<FormToggle
			{ ...props }
			checked={ isChecked }
			onChange={ () => {
				setChecked( ! isChecked );
			} }
		/>
	);
};

export const _default = () => {
	return <FormToggleWithState checked />;
};
