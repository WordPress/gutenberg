/**
 * External dependencies
 */
import type { CSSProperties } from 'react';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPalette from '..';
import Popover from '../../popover';
import { Provider as SlotFillProvider } from '../../slot-fill';

const meta: ComponentMeta< typeof ColorPalette > = {
	title: 'Components/ColorPalette',
	component: ColorPalette,
	argTypes: {
		as: { control: { type: null } },
		onChange: { action: 'onChange', control: { type: null } },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof ColorPalette > = ( {
	onChange,
	...args
} ) => {
	const [ color, setColor ] = useState< string | undefined >();

	return (
		<SlotFillProvider>
			<ColorPalette
				{ ...args }
				value={ color }
				onChange={ ( newColor ) => {
					setColor( newColor );
					onChange?.( newColor );
				} }
			/>
			{ /* @ts-expect-error The 'Slot' component hasn't been typed yet. */ }
			<Popover.Slot />
		</SlotFillProvider>
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

export const CSSVariables: ComponentStory< typeof ColorPalette > = ( args ) => {
	return (
		<div
			style={
				{
					'--red': '#f00',
					'--yellow': '#ff0',
					'--blue': '#00f',
				} as CSSProperties
			}
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
