const gradients = {
	linear: 'linear-gradient',
	radial: 'radial-gradient',
};

const getGradientType = ( color ) => {
	if ( color?.includes( gradients.radial ) ) {
		return gradients.radial;
	} else if ( color?.includes( gradients.linear ) ) {
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
	getGradientType,
	isGradient: ( color ) => !! getGradientType( color ),
};
