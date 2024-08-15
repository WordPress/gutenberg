/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

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
	title: 'Components/TextControl',
	argTypes: {
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
		onChange: { action: 'onChange' },
		value: { control: { type: null } },
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
	__nextHasNoMarginBottom: true,
};

export const WithLabelAndHelpText: StoryFn< typeof TextControl > =
	DefaultTemplate.bind( {} );
WithLabelAndHelpText.args = {
	...Default.args,
	label: 'Label Text',
	help: 'Help text to explain the input.',
};
