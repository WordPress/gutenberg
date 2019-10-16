/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

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
			label="Is author"
			checked={ isChecked }
			onChange={ setChecked }
		/>
	);
};

export const All = () => {
	const [ isChecked, setChecked ] = useState( true );
	const heading = text( 'Heading', 'User' );
	const label = text( 'Label', 'Is author' );
	const help = text( 'Help', 'Is the user an author or not?' );
	return (
		<CheckboxControl
			heading={ heading }
			label={ label }
			help={ help }
			checked={ isChecked }
			onChange={ setChecked }
		/>
	);
};
