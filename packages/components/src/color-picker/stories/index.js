/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPicker from '../';

export default { title: 'Components/ColorPicker', component: ColorPicker };

const ColorPickerWithState = ( { ...props } ) => {
	const [ color, setColor ] = useState( '#f00' );
	return (
		<ColorPicker
			{ ...props }
			color={ color }
			onChangeComplete={ ( value ) => setColor( value.hex ) }
		/>
	);
};

export const _default = () => {
	return <ColorPickerWithState disableAlpha />;
};

export const alphaEnabled = () => {
	return <ColorPickerWithState disableAlpha={ false } />;
};
