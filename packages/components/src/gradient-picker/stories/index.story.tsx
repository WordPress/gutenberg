/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';
import { fn } from 'storybook/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import GradientPicker from '..';

const meta: Meta< typeof GradientPicker > = {
	title: 'Components/Selection & Input/Color/GradientPicker',
	id: 'components-gradientpicker',
	component: GradientPicker,
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'stable',
			whereUsed: 'global',
		},
	},
	args: {
		onChange: fn(),
	},
	argTypes: {
		value: { control: false },
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
	{
		name: 'HSL blue to purple',
		gradient:
			'linear-gradient(135deg,hsl(200, 100%, 50%) 0%,hsl(280, 100%, 60%) 100%)',
		slug: 'hsl-blue-to-purple',
	},
	{
		name: 'HSLA green to red',
		gradient:
			'linear-gradient(135deg,hsla(120, 100%, 40%, 0.85) 0%,hsla(0, 100%, 50%, 0.85) 100%)',
		slug: 'hsla-green-to-red',
	},
];

const Template: StoryFn< typeof GradientPicker > = ( {
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

export const CSSVariables: StoryFn< typeof GradientPicker > = ( args ) => {
	return (
		<div
			style={ {
				'--red': '#f00',
				'--yellow': '#ff0',
				'--blue': '#00f',
			} }
		>
			<Template { ...args } />
		</div>
	);
};
CSSVariables.args = {
	...Default.args,
	gradients: [
		{
			name: 'Red to Yellow',
			gradient:
				'linear-gradient(135deg,var(--red) 0%,var(--yellow) 100%)',
			slug: 'red-to-yellow',
		},
		{
			name: 'Yellow to Blue',
			gradient:
				'linear-gradient(135deg,var(--yellow) 0%,var(--blue) 100%)',
			slug: 'yellow-to-blue',
		},
		{
			name: 'Blue to Red',
			gradient: 'linear-gradient(135deg,var(--blue) 0%,var(--red) 100%)',
			slug: 'blue-to-red',
		},
	],
};
