/**
 * External dependencies
 */
import { object } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPalette from '../';

export default { title: 'Components/ColorPalette', component: ColorPalette };

const ColorPaletteWithState = ( props ) => {
	const [ color, setColor ] = useState( '#F00' );
	return <ColorPalette { ...props } value={ color } onChange={ setColor } />;
};

export const _default = () => {
	const colors = [
		{ name: 'red', color: '#f00' },
		{ name: 'white', color: '#fff' },
		{ name: 'blue', color: '#00f' },
	];

	return <ColorPaletteWithState colors={ colors } />;
};

export const withKnobs = () => {
	const colors = [
		object( 'Red', { name: 'red', color: '#f00' } ),
		object( 'White', { name: 'white', color: '#fff' } ),
		object( 'Blue', { name: 'blue', color: '#00f' } ),
	];

	return <ColorPaletteWithState colors={ colors } />;
};
