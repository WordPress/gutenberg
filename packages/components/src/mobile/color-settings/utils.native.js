const gradients = {
	linear: 'linear-gradient',
	radial: 'radial-gradient',
};

const gradientOptions = [
	{ label: 'Linear', value: gradients.linear },
	{ label: 'Radial', value: gradients.radial },
];

const getGradientType = ( color ) => {
	if ( color?.includes( 'radial-gradient' ) ) {
		return gradients.radial;
	} else if ( color?.includes( 'linear-gradient' ) ) {
		return gradients.linear;
	}
	return false;
};

export const colorsUtils = {
	subsheets: {
		settings: 'Settings',
		color: 'Color',
	},
	segments: [ 'Solid', 'Gradient' ],
	gradients,
	gradientOptions,
	getGradientType,
	isGradient: ( color ) => !! getGradientType( color ),
};
