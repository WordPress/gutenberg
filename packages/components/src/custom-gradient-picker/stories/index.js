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

export const _default = () => {
	return <CustomGradientPickerWithState />;
};
