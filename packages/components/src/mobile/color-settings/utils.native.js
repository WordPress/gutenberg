const gradients = {
	linear: 'linear',
	radial: 'radial',
};

const getGradientType = ( color ) => {
	if ( color.includes( 'radial-gradient' ) ) {
		return gradients.radial;
	} else if ( color.includes( 'linear-gradient' ) ) {
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
