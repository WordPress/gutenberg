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
import CustomGradientPicker from '../';

const meta: ComponentMeta< typeof CustomGradientPicker > = {
	title: 'Components/CustomGradientPicker',
	component: CustomGradientPicker,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const CustomGradientPickerWithState: ComponentStory<
	typeof CustomGradientPicker
> = ( { onChange, ...props } ) => {
	const [ gradient, setGradient ] = useState< string >();
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
Default.args = {
	__nextHasNoMargin: true,
};
