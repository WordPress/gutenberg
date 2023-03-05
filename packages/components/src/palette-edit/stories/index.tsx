/**
 * External dependencies
 */
import type { FunctionComponent } from 'react';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PaletteEdit from '..';
import type {
	Color,
	Gradient,
	PaletteEditColorsProps,
	PaletteEditGradientsProps,
} from '../types';

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

const ColorsTemplate: ComponentStory<
	FunctionComponent< PaletteEditColorsProps >
> = ( args ) => {
	const { colors, onChange, ...props } = args;

	const [ controlledColors, setControlledColors ] = useState( colors );

	return (
		<PaletteEdit
			colors={ controlledColors }
			onChange={ ( newColors?: Color[] ) => {
				if ( newColors ) {
					setControlledColors( newColors );
				}
			} }
			{ ...props }
		/>
	);
};

export const Default = ColorsTemplate.bind( {} );
Default.args = {
	colors: [
		{ color: '#1a4548', name: 'Primary', slug: 'primary' },
		{ color: '#0000ff', name: 'Secondary', slug: 'secondary' },
	],
	paletteLabel: 'This is a label',
	emptyMessage: 'There is no color',
};

const GradientsTemplate: ComponentStory<
	FunctionComponent< PaletteEditGradientsProps >
> = ( args ) => {
	const { gradients, onChange, ...props } = args;

	const [ controlledGradients, setControlledGradients ] =
		useState( gradients );

	return (
		<PaletteEdit
			gradients={ controlledGradients }
			onChange={ ( newGradients?: Gradient[] ) => {
				if ( newGradients ) {
					setControlledGradients( newGradients );
				}
			} }
			{ ...props }
		/>
	);
};

export const Gradients = GradientsTemplate.bind( {} );
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
	paletteLabel: 'This is a label',
	emptyMessage: 'There is no gradient',
};
