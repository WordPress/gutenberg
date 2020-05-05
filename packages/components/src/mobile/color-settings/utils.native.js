export const colorsUtils = {
	subsheets: {
		settings: 'Settings',
		color: 'Color',
	},
	segments: [ 'Solid', 'Gradient' ],
	isGradient: ( color ) => color?.includes( 'linear-gradient' ),
};
