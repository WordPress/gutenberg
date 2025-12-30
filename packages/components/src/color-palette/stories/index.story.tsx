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
import ColorPalette from '..';

const meta: Meta< typeof ColorPalette > = {
	title: 'Components/Selection & Input/Color/ColorPalette',
	id: 'components-colorpalette',
	component: ColorPalette,
	argTypes: {
		as: { control: false },
		onChange: { action: 'onChange', control: false },
		value: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof ColorPalette > = ( {
	onChange,
	value,
	...args
} ) => {
	const [ color, setColor ] = useState< string | undefined >( value );

	return (
		<ColorPalette
			{ ...args }
			value={ color }
			onChange={ ( newColor ) => {
				setColor( newColor );
				onChange?.( newColor );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	colors: [
		{ name: 'Red', color: '#f00' },
		{ name: 'White', color: '#fff' },
		{ name: 'Blue', color: '#00f' },
	],
};

export const InitialValue = Template.bind( {} );
InitialValue.args = {
	colors: [
		{ name: 'Red', color: '#f00' },
		{ name: 'White', color: '#fff' },
		{ name: 'Blue', color: '#00f' },
	],
	value: '#00f',
};

export const MultipleOrigins = Template.bind( {} );
MultipleOrigins.args = {
	colors: [
		{
			name: 'Primary colors',
			colors: [
				{ name: 'Red', color: '#f00' },
				{ name: 'Yellow', color: '#ff0' },
				{ name: 'Blue', color: '#00f' },
			],
		},
		{
			name: 'Secondary colors',
			colors: [
				{ name: 'Orange', color: '#f60' },
				{ name: 'Green', color: '#0f0' },
				{ name: 'Purple', color: '#60f' },
			],
		},
	],
};

export const CSSVariables: StoryFn< typeof ColorPalette > = ( args ) => {
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
	colors: [
		{ name: 'Red', color: 'var(--red)' },
		{ name: 'Yellow', color: 'var(--yellow)' },
		{ name: 'Blue', color: 'var(--blue)' },
	],
};
