/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextControl from '..';

const meta: ComponentMeta< typeof TextControl > = {
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
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof TextControl > = ( {
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

export const Default: ComponentStory< typeof TextControl > =
	DefaultTemplate.bind( {} );
Default.args = {};

export const WithLabelAndHelpText: ComponentStory< typeof TextControl > =
	DefaultTemplate.bind( {} );
WithLabelAndHelpText.args = {
	...Default.args,
	label: 'Label Text',
	help: 'Help text to explain the input.',
};
