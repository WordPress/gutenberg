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
import PaletteEdit from '..';
import type { Color, Gradient } from '../types';

const meta: ComponentMeta< typeof PaletteEdit > = {
	title: 'Components/PaletteEdit',
	component: PaletteEdit,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof PaletteEdit > = ( args ) => {
	const { colors, gradients, onChange, ...props } = args;
	const [ value, setValue ] = useState( gradients || colors );

	return (
		<PaletteEdit
			{ ...( gradients
				? {
						gradients: value as Gradient[],
						onChange: ( newValue?: Gradient[] ) => {
							setValue( newValue );
							onChange( newValue );
						},
				  }
				: {
						colors: value as Color[],
						onChange: ( newValue?: Color[] ) => {
							setValue( newValue );
							onChange( newValue );
						},
				  } ) }
			{ ...props }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	colors: [
		{ color: '#1a4548', name: 'Primary', slug: 'primary' },
		{ color: '#0000ff', name: 'Secondary', slug: 'secondary' },
	],
	paletteLabel: 'Colors',
	emptyMessage: 'Colors are empty',
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
