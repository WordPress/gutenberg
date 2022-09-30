/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomGradientPicker from '../';

export default {
	title: 'Components/CustomGradientPicker',
	component: CustomGradientPicker,
	argTypes: {
		__nextHasNoMargin: { control: { type: 'boolean' } },
	},
};

const CustomGradientPickerWithState = ( props ) => {
	const [ gradient, setGradient ] = useState();
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
