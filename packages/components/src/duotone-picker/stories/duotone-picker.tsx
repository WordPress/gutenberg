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
import { DuotonePicker } from '..';
import type { DuotonePickerProps } from '../types';

const meta: ComponentMeta< typeof DuotonePicker > = {
	title: 'Components/DuotonePicker',
	component: DuotonePicker,
	argTypes: {
		onChange: { action: 'onChange' },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DUOTONE_PALETTE = [
	{
		colors: [ '#8c00b7', '#fcff41' ],
		name: 'Purple and yellow',
		slug: 'purple-yellow',
	},
	{
		colors: [ '#000097', '#ff4747' ],
		name: 'Blue and red',
		slug: 'blue-red',
	},
];

const COLOR_PALETTE = [
	{ color: '#ff4747', name: 'Red', slug: 'red' },
	{ color: '#fcff41', name: 'Yellow', slug: 'yellow' },
	{ color: '#000097', name: 'Blue', slug: 'blue' },
	{ color: '#8c00b7', name: 'Purple', slug: 'purple' },
];

const Template: ComponentStory< typeof DuotonePicker > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState< DuotonePickerProps[ 'value' ] >();

	return (
		<DuotonePicker
			{ ...args }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange( ...changeArgs );
			} }
			value={ value }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	colorPalette: COLOR_PALETTE,
	duotonePalette: DUOTONE_PALETTE,
};
