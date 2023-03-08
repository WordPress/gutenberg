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
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const CustomGradientPickerWithState: ComponentStory<
	typeof CustomGradientPicker
> = ( props ) => {
	const [ gradient, setGradient ] = useState< string | undefined >();
	return (
		<CustomGradientPicker
			{ ...props }
			value={ gradient }
			onChange={ setGradient }
		/>
	);
};

export const Default = CustomGradientPickerWithState.bind( {} );
Default.args = {
	__nextHasNoMargin: true,
};
