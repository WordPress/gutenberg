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
import GradientPicker from '..';

const meta: ComponentMeta< typeof GradientPicker > = {
	title: 'Components/GradientPicker',
	component: GradientPicker,
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
		actions: { argTypesRegex: '^on.*' },
	},
	argTypes: {
		value: { control: { type: null } },
	},
};
export default meta;

const GRADIENTS = [
	{
		name: 'Vivid cyan blue to vivid purple',
		gradient:
			'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
		slug: 'vivid-cyan-blue-to-vivid-purple',
	},
	{
		name: 'Light green cyan to vivid green cyan',
		gradient:
			'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
		slug: 'light-green-cyan-to-vivid-green-cyan',
	},
	{
		name: 'Luminous vivid amber to luminous vivid orange',
		gradient:
			'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
		slug: 'luminous-vivid-amber-to-luminous-vivid-orange',
	},
	{
		name: 'Luminous vivid orange to vivid red',
		gradient:
			'linear-gradient(135deg,rgba(255,105,0,1) 0%,rgb(207,46,46) 100%)',
		slug: 'luminous-vivid-orange-to-vivid-red',
	},
	{
		name: 'Very light gray to cyan bluish gray',
		gradient:
			'linear-gradient(135deg,rgb(238,238,238) 0%,rgb(169,184,195) 100%)',
		slug: 'very-light-gray-to-cyan-bluish-gray',
	},
	{
		name: 'Cool to warm spectrum',
		gradient:
			'linear-gradient(135deg,rgb(74,234,220) 0%,rgb(151,120,209) 20%,rgb(207,42,186) 40%,rgb(238,44,130) 60%,rgb(251,105,98) 80%,rgb(254,248,76) 100%)',
		slug: 'cool-to-warm-spectrum',
	},
];

const Template: ComponentStory< typeof GradientPicker > = ( {
	onChange,
	...props
} ) => {
	const [ gradient, setGradient ] =
		useState< ( typeof props )[ 'value' ] >( null );
	return (
		<GradientPicker
			{ ...props }
			value={ gradient }
			onChange={ ( ...changeArgs ) => {
				setGradient( ...changeArgs );
				onChange?.( ...changeArgs );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	__nextHasNoMargin: true,
	gradients: GRADIENTS,
};

export const WithNoExistingGradients = Template.bind( {} );
WithNoExistingGradients.args = {
	...Default.args,
	gradients: [],
};

export const MultipleOrigins = Template.bind( {} );
MultipleOrigins.args = {
	...Default.args,
	gradients: [
		{ name: 'Origin 1', gradients: GRADIENTS },
		{ name: 'Origin 2', gradients: GRADIENTS },
	],
};
