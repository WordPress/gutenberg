
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPicker from '../';

export default { title: 'ColorPicker', component: ColorPicker };

export const _default = () => {
	const [ color, setColor ] = useState( '#f00' );
	return (
		<ColorPicker
			color={ color }
			onChangeComplete={ ( value ) => setColor( value.hex ) }
			disableAlpha
		/>
	);
};

export const AlphaEnabled = () => {
	const [ color, setColor ] = useState( '#f0f' );
	return (
		<ColorPicker
			color={ color }
			onChangeComplete={ ( value ) => setColor( value.hex ) }
			disableAlpha={ false }
		/>
	);
};

