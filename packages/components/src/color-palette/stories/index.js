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

export default { title: 'ColorPalette', component: ColorPalette };

export const _default = () => {
	const [ color, setColor ] = useState( '#f00' );

	const colors = [
		{ name: 'red', color: '#f00' },
		{ name: 'white', color: '#fff' },
		{ name: 'blue', color: '#00f' },
	];

	return (
		<ColorPalette
			colors={ colors }
			value={ color }
			onChange={ setColor }
		/>
	);
};

export const withKnobs = () => {
	const [ color, setColor ] = useState( '#f00' );

	const colors = [
		object( 'Red', { name: 'red', color: '#f00' } ),
		object( 'White', { name: 'white', color: '#fff' } ),
		object( 'Blue', { name: 'blue', color: '#00f' } ),
	];

	return (
		<ColorPalette
			colors={ colors }
			value={ color }
			onChange={ setColor }
		/>
	);
};

