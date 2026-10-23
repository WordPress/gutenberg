import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import LetterSpacingControl from '../';

const meta: Meta< typeof LetterSpacingControl > = {
	id: 'blockeditor-letterspacingcontrol',
	title: 'Editor/Block Editor/LetterSpacingControl',
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
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'The current value of the letter spacing setting.',
			table: {
				type: { summary: 'string' },
			},
		},
		onChange: {
			action: 'onChange',
			// @ts-expect-error Storybook types omit `null`, which hides the control.
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

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string | undefined >( '' );
		return (
			<LetterSpacingControl
				{ ...args }
				value={ value }
				onChange={ ( newValue ) => {
					// Storybook passes the `onChange` action.
					onChange!( newValue );
					setValue( newValue );
				} }
			/>
		);
	},
};
