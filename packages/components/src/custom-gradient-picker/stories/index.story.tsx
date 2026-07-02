/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';
import { fn } from 'storybook/test';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomGradientPicker from '../';

const meta: Meta< typeof CustomGradientPicker > = {
	title: 'Components/Selection & Input/Color/CustomGradientPicker',
	id: 'components-customgradientpicker',
	component: CustomGradientPicker,
	args: {
		onChange: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Mostly an internal component. Use `GradientPicker` instead.',
		},
	},
};
export default meta;

const CustomGradientPickerWithState: StoryFn<
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
