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
import type { Color } from '../types';

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

export const ColorsTemplate: ComponentStory< typeof PaletteEdit > = ( args ) => {
	const {
		colors,
		onChange,
		...props
	} = args;

	const [ controlledColors, setControlledColors ] = useState( colors );

	return (
		<PaletteEdit
			colors={ controlledColors }
			onChange={ ( newColors: Color[] ) => {
				setControlledColors( newColors);
			} }
			{ ...props }
		/>
	);
};

ColorsTemplate.bind( {} );
ColorsTemplate.args = {
	colors: [ { color: '#1a4548', name: 'Primary', slug: 'primary' } ],
	paletteLabel: 'This is a label',
	emptyMessage: 'There is no color',
};
