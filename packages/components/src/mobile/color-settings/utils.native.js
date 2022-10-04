/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const gradients = {
	linear: 'linear-gradient',
	radial: 'radial-gradient',
};

const gradientOptions = [
	{ label: __( 'Linear' ), value: gradients.linear },
	{ label: __( 'Radial' ), value: gradients.radial },
];

const getGradientType = ( color ) => {
	if ( color?.includes( gradients.radial ) ) {
		return gradients.radial;
	} else if ( color?.includes( gradients.linear ) ) {
		return gradients.linear;
	}
	return false;
};

export const colorsUtils = {
	screens: {
		gradientPicker: 'GradientPicker',
		picker: 'Picker',
		palette: 'Palette',
	},
	segments: [ __( 'Solid' ), __( 'Gradient' ) ],
	gradients,
	gradientOptions,
	getGradientType,
	isGradient: ( color ) => !! getGradientType( color ),
};
