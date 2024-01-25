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
	typography: {
		fontSizes: {
			default: [
				{
					name: 'Small',
					size: '13px',
					slug: 'small',
				},
				{
					name: 'Medium',
					size: '20px',
					slug: 'medium',
				},
				{
					name: 'Large',
					size: '36px',
					slug: 'large',
				},
				{
					name: 'Extra Large',
					size: '42px',
					slug: 'x-large',
				},
			],
			theme: [
				{
					fluid: false,
					name: 'Small',
					size: '0.9rem',
					slug: 'small',
				},
				{
					fluid: false,
					name: 'Medium',
					size: '1.05rem',
					slug: 'medium',
				},
				{
					fluid: {
						max: '1.85rem',
						min: '1.39rem',
					},
					name: 'Large',
					size: '1.85rem',
					slug: 'large',
				},
				{
					fluid: {
						max: '2.5rem',
						min: '1.85rem',
					},
					name: 'Extra Large',
					size: '2.5rem',
					slug: 'x-large',
				},
				{
					fluid: {
						max: '3.27rem',
						min: '2.5rem',
					},
					name: 'Extra Extra Large',
					size: '3.27rem',
					slug: 'xx-large',
				},
			],
		},
	},
};

const GLOBAL_STYLES_RAW_STYLES = {
	color: {
		background: 'var(--wp--preset--color--foreground)',
		text: 'var(--wp--preset--color--tertiary)',
	},
	elements: {
		h1: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--xx-large)',
				lineHeight: '1.15',
			},
		},
		h2: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--x-large)',
			},
		},
		h3: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--large)',
			},
		},
		h4: {
			typography: {
				fontSize:
					'clamp(1.1rem, 1.1rem + ((1vw - 0.2rem) * 0.767), 1.5rem)',
			},
		},
		h5: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--medium)',
			},
		},
		h6: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--small)',
			},
		},
		heading: {
			color: {
				text: 'var(--wp--preset--color--tertiary)',
			},
			typography: {
				fontFamily: 'var(--wp--preset--font-family--heading)',
				lineHeight: '1.2',
			},
		},
		link: {
			color: {
				text: 'var(--wp--preset--color--tertiary)',
			},
		},
	},
	typography: {
		fontFamily: 'var(--wp--preset--font-family--body)',
		fontSize: 'var(--wp--preset--font-size--medium)',
		lineHeight: '1.55',
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
		rawStyles: JSON.stringify( GLOBAL_STYLES_RAW_STYLES ),
	};
}
