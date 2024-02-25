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
import PaletteEdit from '..';
import type { Color, Gradient } from '../types';

const meta: Meta< typeof PaletteEdit > = {
	title: 'Components/PaletteEdit',
	component: PaletteEdit,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof PaletteEdit > = ( args ) => {
	const {
		colors,
		gradients,
		isGradient: _isGradient,
		onChange,
		...props
	} = args;
	const isGradient = _isGradient || !! gradients;
	const [ value, setValue ] = useState( isGradient ? gradients : colors );

	return (
		<PaletteEdit
			isGradient={ isGradient }
			{ ...( isGradient
				? { gradients: value as Gradient[] }
				: { colors: value as Color[] } ) }
			onChange={ ( newValue?: Color[] | Gradient[] ) => {
				setValue( newValue );
				onChange( newValue );
			} }
			{ ...props }
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
	isGradient: true,
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
