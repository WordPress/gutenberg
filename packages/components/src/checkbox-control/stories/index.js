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

export default { title: 'Components|CheckboxControl', component: CheckboxControl };

const CheckboxControlWithState = ( { checked, ...props } ) => {
	const [ isChecked, setChecked ] = useState( checked );

	return (
		<CheckboxControl
			{ ...props }
			checked={ isChecked }
			onChange={ setChecked }
		/>
	);
};

export const _default = () => {
	const label = text( 'Label', 'Is author' );

	return (
		<CheckboxControlWithState
			label={ label }
			checked
		/>
	);
};

export const all = () => {
	const heading = text( 'Heading', 'User' );
	const label = text( 'Label', 'Is author' );
	const help = text( 'Help', 'Is the user an author or not?' );

	return (
		<CheckboxControlWithState
			heading={ heading }
			label={ label }
			help={ help }
			checked
		/>
	);
};
