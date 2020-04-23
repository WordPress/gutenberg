/**
 * External dependencies
 */
import { boolean, select, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InputControl from '../';

export default {
	title: 'Components/InputControl',
	component: InputControl,
};

function Example() {
	const [ value, setValue ] = useState( '' );

	const props = {
		disabled: boolean( 'disabled', false ),
		isFloatingLabel: boolean( 'isFloatingLabel', false ),
		label: text( 'label', 'Value' ),
		placeholder: text( 'placeholder', 'Placeholder' ),
		size: select(
			'size',
			{
				default: 'default',
				small: 'small',
			},
			'default'
		),
	};

	return (
		<InputControl
			{ ...props }
			value={ value }
			onChange={ ( v ) => setValue( v ) }
		/>
	);
}

export const _default = () => {
	return <Example />;
};
