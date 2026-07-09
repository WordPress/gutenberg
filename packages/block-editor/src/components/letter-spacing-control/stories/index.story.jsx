/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LetterSpacingControl from '../';

const meta = {
	title: 'BlockEditor/LetterSpacingControl',
	component: LetterSpacingControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'LetterSpacingControl renders a UnitControl that lets the user enter a letter-spacing value with a unit (px, em, rem).',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'The current value of the letter spacing setting.',
			table: {
				type: { summary: 'string' },
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description:
				'A callback function invoked when the value is changed.',
			table: {
				type: { summary: 'function' },
			},
		},
		__unstableInputWidth: {
			control: 'text',
			description:
				'Input width to pass through to inner UnitControl. Should be a valid CSS value.',
			table: {
				type: { summary: 'string | number | undefined' },
				defaultValue: { summary: '60px' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState( '' );
		return (
			<LetterSpacingControl
				{ ...args }
				value={ value }
				onChange={ ( newValue ) => {
					onChange( newValue );
					setValue( newValue );
				} }
			/>
		);
	},
};
