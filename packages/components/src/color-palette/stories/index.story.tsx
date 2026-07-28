/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPalette from '..';

const meta: Meta< typeof ColorPalette > = {
	tags: [ 'manifest' ],
	title: 'Components/Selection & Input/Color/ColorPalette',
	id: 'components-colorpalette',
	component: ColorPalette,
	argTypes: {
		as: { control: false },
		onChange: { action: 'onChange', control: false },
		selectedSlug: { control: false },
		value: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type ColorPaletteStory = StoryObj< typeof ColorPalette >;

const Template = ( {
	onChange,
	value,
	selectedSlug,
	...args
}: React.ComponentProps< typeof ColorPalette > ) => {
	const [ color, setColor ] = useState< string | undefined >( value );
	const [ slug, setSlug ] = useState< string | undefined >( selectedSlug );

	return (
		<ColorPalette
			{ ...args }
			value={ color }
			selectedSlug={ slug }
			onChange={ ( newColor, index, newSlug ) => {
				setColor( newColor );
				setSlug( newSlug );
				onChange?.( newColor, index, newSlug );
			} }
		/>
	);
};

export const Default: ColorPaletteStory = {
	render: Template,
	args: {
		colors: [
			{ name: 'Red', color: '#f00' },
			{ name: 'White', color: '#fff' },
			{ name: 'Blue', color: '#00f' },
		],
	},
};

export const InitialValue: ColorPaletteStory = {
	render: Template,
	args: {
		colors: [
			{ name: 'Red', color: '#f00' },
			{ name: 'White', color: '#fff' },
			{ name: 'Blue', color: '#00f' },
		],
		value: '#00f',
	},
};

export const MultipleOrigins: ColorPaletteStory = {
	render: Template,
	args: {
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
	},
};

export const DuplicateColors: ColorPaletteStory = {
	render: Template,
	args: {
		colors: [
			{ name: 'Dark Background', slug: 'dark-background', color: '#000' },
			{ name: 'Dark Text', slug: 'dark-text', color: '#000' },
			{ name: 'Brand', slug: 'brand', color: '#0073aa' },
		],
		value: '#000',
		selectedSlug: 'dark-text',
	},
};

export const CSSVariables: ColorPaletteStory = {
	render: ( args ) => (
		<div
			style={ {
				'--red': '#f00',
				'--yellow': '#ff0',
				'--blue': '#00f',
			} }
		>
			<Template { ...args } />
		</div>
	),
	args: {
		colors: [
			{ name: 'Red', color: 'var(--red)' },
			{ name: 'Yellow', color: 'var(--yellow)' },
			{ name: 'Blue', color: 'var(--blue)' },
		],
	},
};
