/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorControl from '../';

export default { title: 'Components|ColorControl', component: ColorControl };

const ColorControlWithState = ( { ...props } ) => {
	const [ color, setColor ] = useState( '#f00' );
	return (
		<ColorControl
			{ ...props }
			color={ color }
			onChangeComplete={ ( value ) => setColor( value.hex ) }
		/>
	);
};

export const _default = () => {
	return (
		<ColorControlWithState
			label="Color Control Default"
			disableAlpha
		/>
	);
};

export const alphaEnabled = () => {
	return (
		<ColorControlWithState
			label="Color Control with Alpha Enabled"
			disableAlpha={ false }
		/>
	);
};
