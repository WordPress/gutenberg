import type { Meta, StoryFn } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from '@wordpress/element';
import PaletteEdit from '..';
import type { Color, Duotone, Gradient, PaletteElement } from '../types';

const meta: Meta< typeof PaletteEdit > = {
	title: 'Components/PaletteEdit',
	component: PaletteEdit,
	args: {
		onChange: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'editor',
		},
	},
};
export default meta;

const Template: StoryFn< typeof PaletteEdit > = ( args ) => {
	const { colors, gradients, duotones, colorPalette, onChange, ...props } =
		args;
	const [ value, setValue ] = useState< PaletteElement[] | undefined >(
		gradients ?? duotones ?? colors
	);
	// The story's `onChange` is a mock shared by all three variants, so it is
	// called through a single loosely typed reference.
	const handleChange = ( newValue?: PaletteElement[] ) => {
		setValue( newValue );
		( onChange as ( values?: PaletteElement[] ) => void )( newValue );
	};

	if ( gradients ) {
		return (
			<PaletteEdit
				{ ...props }
				gradients={ ( value ?? [] ) as Gradient[] }
				onChange={ handleChange }
			/>
		);
	}

	if ( duotones ) {
		return (
			<PaletteEdit
				{ ...props }
				duotones={ ( value ?? [] ) as Duotone[] }
				colorPalette={ colorPalette }
				onChange={ handleChange }
			/>
		);
	}

	return (
		<PaletteEdit
			{ ...props }
			colors={ ( value ?? [] ) as Color[] }
			onChange={ handleChange }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	colors: [
		{ color: '#1a4548', name: 'Primary', slug: 'primary' },
		{ color: '#0000ff', name: 'Secondary', slug: 'secondary' },
		{ color: '#fb326b', name: 'Tertiary', slug: 'tertiary' },
	],
	paletteLabel: 'Colors',
	emptyMessage: 'Colors are empty',
	popoverProps: {
		placement: 'bottom-start',
		offset: 8,
	},
};

export const Gradients = Template.bind( {} );
Gradients.args = {
	gradients: [
		{
			gradient:
				'linear-gradient(135deg,rgb(255,245,203) 0%,rgb(182,227,212) 50%,rgb(51,167,181) 100%)',
			name: 'Pale ocean',
			slug: 'pale-ocean',
		},
		{
			gradient:
				'linear-gradient(135deg,rgb(2,3,129) 0%,rgb(40,116,252) 100%)',
			name: 'Midnight',
			slug: 'midnight',
		},
	],
	paletteLabel: 'Gradients',
	emptyMessage: 'Gradients are empty',
};

export const Duotones = Template.bind( {} );
Duotones.args = {
	duotones: [
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
	],
	colorPalette: [
		{ color: '#ff4747', name: 'Red', slug: 'red' },
		{ color: '#fcff41', name: 'Yellow', slug: 'yellow' },
		{ color: '#000097', name: 'Blue', slug: 'blue' },
		{ color: '#8c00b7', name: 'Purple', slug: 'purple' },
	],
	paletteLabel: 'Duotones',
	emptyMessage: 'Duotones are empty',
};
