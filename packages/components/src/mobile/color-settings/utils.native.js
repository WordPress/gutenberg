const gradients = {
	linear: 'linear-gradient',
	radial: 'radial-gradient',
};

const gradientOptions = [
	{ label: 'Linear', value: gradients.linear },
	{ label: 'Radial', value: gradients.radial },
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
	segments: [ 'Solid', 'Gradient' ],
	gradients,
	gradientOptions,
	getGradientType,
	isGradient: ( color ) => !! getGradientType( color ),
};
