/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeightControl from '../';

/**
 * The `HeightControl` component renders a height control component.
 */
const meta = {
	title: 'BlockEditor/HeightControl',
	component: HeightControl,
	argTypes: {
		value: {
			control: false,
			defaultValue: '100px',
			description:
				'The current height value. It can be a string including a unit (e.g., `100px`), or a number.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		onChange: {
			action: 'onChange',
			control: false,
			description:
				'A callback function invoked when the height value is changed. Called with the new height value as the only argument.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		label: {
			control: 'text',
			defaultValue: 'Height',
			description: 'A label for the height control.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		return (
			<HeightControl
				{ ...args }
				onChange={ ( newValue ) => {
					onChange( newValue );
					setValue( newValue );
				} }
				value={ value }
			/>
		);
	},
};
