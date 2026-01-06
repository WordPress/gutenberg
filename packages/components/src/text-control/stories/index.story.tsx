/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextControl from '..';

const meta: Meta< typeof TextControl > = {
	component: TextControl,
	title: 'Components/Selection & Input/Common/TextControl',
	id: 'components-textcontrol',
	argTypes: {
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
		onChange: { action: 'onChange' },
		value: { control: false },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const DefaultTemplate: StoryFn< typeof TextControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState( '' );

	return (
		<TextControl
			{ ...args }
			value={ value }
			onChange={ ( v ) => {
				setValue( v );
				onChange( v );
			} }
		/>
	);
};

export const Default: StoryFn< typeof TextControl > = DefaultTemplate.bind(
	{}
);
Default.args = {
	__next40pxDefaultSize: true,
	placeholder: 'Placeholder',
};

export const WithLabelAndHelpText: StoryFn< typeof TextControl > =
	DefaultTemplate.bind( {} );
WithLabelAndHelpText.args = {
	...Default.args,
	label: 'Label Text',
	help: 'Help text to explain the input.',
};
