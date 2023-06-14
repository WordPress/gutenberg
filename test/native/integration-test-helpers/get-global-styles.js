const GLOBAL_STYLES_RAW_FEATURES = {
	color: {
		text: true,
		background: true,
		defaultPalette: true,
		defaultGradients: false,
		palette: {
			default: [
				{
					color: '#f78da7',
					name: 'Pale pink',
					slug: 'pale-pink',
				},
				{
					color: '#cf2e2e',
					name: 'Vivid red',
					slug: 'vivid-red',
				},
				{
					color: '#ff6900',
					name: 'Luminous vivid orange',
					slug: 'luminous-vivid-orange',
				},
			],
			theme: [
				{
					color: '#e2d8ff',
					name: 'Foreground',
					slug: 'foreground',
				},
				{
					color: '#2f1ab2',
					name: 'Background',
					slug: 'background',
				},
				{
					color: '#2411a4',
					name: 'Tertiary',
					slug: 'tertiary',
				},
			],
		},
	},
};

/**
 * Returns some global styles data to test with the editor.
 *
 * @return {Object} Editor features.
 */
export function getGlobalStyles() {
	return {
		rawFeatures: JSON.stringify( GLOBAL_STYLES_RAW_FEATURES ),
	};
}
