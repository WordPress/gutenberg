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
import RadioControl from '..';

const meta: Meta< typeof RadioControl > = {
	component: RadioControl,
	title: 'Components/RadioControl',
	argTypes: {
		onChange: {
			action: 'onChange',
		},
		selected: {
			control: { type: null },
		},
		label: {
			control: { type: 'text' },
		},
		help: {
			control: { type: 'text' },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof RadioControl > = ( {
	onChange,
	options,
	...args
} ) => {
	const [ value, setValue ] = useState( options?.[ 0 ]?.value );

	return (
		<RadioControl
			{ ...args }
			selected={ value }
			options={ options }
			onChange={ ( v ) => {
				setValue( v );
				onChange( v );
			} }
		/>
	);
};

export const Default: StoryFn< typeof RadioControl > = Template.bind( {} );
Default.args = {
	label: 'Post visibility',
	options: [
		{ label: 'Public', value: 'public' },
		{ label: 'Private', value: 'private' },
		{ label: 'Password Protected', value: 'password' },
	],
};
