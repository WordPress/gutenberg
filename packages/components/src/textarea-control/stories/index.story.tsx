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
import TextareaControl from '..';

const meta: Meta< typeof TextareaControl > = {
	component: TextareaControl,
	title: 'Components/Selection & Input/Common/TextareaControl',
	id: 'components-textareacontrol',
	argTypes: {
		onChange: { action: 'onChange' },
		label: { control: { type: 'text' } },
		help: { control: { type: 'text' } },
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

const Template: StoryFn< typeof TextareaControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState( '' );

	return (
		<TextareaControl
			{ ...args }
			value={ value }
			onChange={ ( v ) => {
				setValue( v );
				onChange( v );
			} }
		/>
	);
};

export const Default: StoryFn< typeof TextareaControl > = Template.bind( {} );
Default.args = {
	__nextHasNoMarginBottom: true,
	label: 'Text',
	help: 'Enter some text',
	placeholder: 'Placeholder',
};
