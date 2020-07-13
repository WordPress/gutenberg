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
		<div style={ { maxWidth: 300 } }>
			<ColorPicker
				{ ...props }
				color={ color }
				onChangeComplete={ ( value ) => setColor( value.hex ) }
			/>
		</div>
	);
};

export const _default = () => {
	return <ColorPickerWithState disableAlpha />;
};

export const alphaEnabled = () => {
	return <ColorPickerWithState disableAlpha={ false } />;
};
