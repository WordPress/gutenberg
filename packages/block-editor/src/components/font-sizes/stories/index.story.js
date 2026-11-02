/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontSizePicker from '../font-size-picker.js';

const meta = {
	title: 'BlockEditor/FontSizePicker',
	component: FontSizePicker,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Renders a user interface that allows the user to select predefined (common) font sizes.',
			},
		},
	},
	argTypes: {
		fallbackFontSize: {
			control: { type: null },
			description:
				'Starting position for the font size picker slider, if active.',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			table: {
				type: { summary: 'function' },
			},
			description: 'Function executed when the font size changes.',
		},
		value: {
			control: { type: 'number' },
			description: 'The current font size value.',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		withSlider: {
			control: { type: null },
			description:
				'To control the UI to contain a slider or a numeric text input field.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();

		return (
			<FontSizePicker
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
			/>
		);
	},
};
