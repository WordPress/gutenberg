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
import CustomGradientPicker from '../';

const meta: Meta< typeof CustomGradientPicker > = {
	title: 'Components/CustomGradientPicker',
	component: CustomGradientPicker,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const CustomGradientPickerWithState: StoryFn<
	typeof CustomGradientPicker
> = ( { onChange, value, ...props } ) => {
	const [ gradient, setGradient ] = useState( value );
	return (
		<CustomGradientPicker
			{ ...props }
			value={ gradient }
			onChange={ ( newGradient ) => {
				setGradient( newGradient );
				onChange( newGradient );
			} }
		/>
	);
};

export const Default = CustomGradientPickerWithState.bind( {} );

export const WithCSSVariables = CustomGradientPickerWithState.bind( {} );
WithCSSVariables.args = {
	// eslint-disable-next-line no-restricted-syntax
	value: 'linear-gradient(135deg,var(--wp-admin-theme-color) 0%,var(--undefined-color, magenta) 100%)',
};
