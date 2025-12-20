/**
 * Internal dependencies
 */
import {
	getBlockPaddings,
	getBlockColors,
	parseStylesVariables,
	getGlobalStyles,
} from '../use-global-styles-context';

const DEFAULT_COLORS = [
	{ color: '#cd2653', name: 'Accent Color', slug: 'accent' },
	{ color: '#000000', name: 'Primary', slug: 'primary' },
	{ color: '#6d6d6d', name: 'Secondary', slug: 'secondary' },
];

const GLOBAL_STYLES_PALETTE = [
	{
		slug: 'green',
		color: '#D1E4DD',
		name: 'Green',
	},
	{
		slug: 'blue',
		color: '#D1DFE4',
		name: 'Blue',
	},
	{
		slug: 'purple',
		color: '#D1D1E4',
		name: 'Purple',
	},
	{
		color: '#cf1594',
		name: 'Color 2 ',
		slug: 'custom-color-2',
	},
];

const GLOBAL_STYLES_GRADIENTS = {
	default: [
		{
			name: 'Vivid cyan blue to vivid purple',
			gradient:
				'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
			slug: 'vivid-cyan-blue-to-vivid-purple',
		},
		{
			name: 'Light green cyan to vivid green cyan',
			gradient:
				'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
			slug: 'light-green-cyan-to-vivid-green-cyan',
		},
	],
	theme: [
		{
			slug: 'purple-to-blue',
			gradient:
				'linear-gradient(160deg, var(--wp--preset--color--purple), var(--wp--preset--color--blue))',
			name: 'Purple to Blue',
		},
		{
			slug: 'green-to-purple',
			gradient:
				'linear-gradient(160deg, var(--wp--preset--color--green), var(--wp--preset--color--purple))',
			name: 'Green to Purple',
		},
	],
};

const DEFAULT_GLOBAL_STYLES = {
	color: {
		background: 'var(--wp--preset--color--green)',
		text: 'var(--wp--preset--color--blue)',
	},
	typography: {
		fontSize: 'var(--wp--preset--font-size--normal)',
		lineHeight: 'var(--wp--custom--line-height--body)',
	},
	elements: {
		link: {
			color: {
				text: 'var(--wp--preset--color--purple)',
			},
		},
		h1: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--gigantic)',
				lineHeight: 'var(--wp--custom--line-height--page-title)',
			},
		},
		h2: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--extra-large)',
				lineHeight: 'var(--wp--custom--line-height--heading)',
			},
		},
	},
	blocks: {
		'core/button': {
			color: {
				background: 'var(--wp--preset--color--purple)',
				text: 'var(--wp--preset--color--green)',
			},
			typography: {
				fontSize: 'var(--wp--preset--font-size--normal)',
			},
		},
		'core/separator': {
			color: {
				text: 'var:preset|color|custom-color-2',
			},
		},
	},
};

const PARSED_GLOBAL_STYLES = {
	color: {
		background: '#D1E4DD',
		text: '#D1DFE4',
	},
	typography: {
		fontSize: '18px',
		lineHeight: '1.7',
	},
	elements: {
		link: {
			color: {
				text: '#D1D1E4',
			},
		},
		h1: {
			typography: {
				fontSize: '144px',
				lineHeight: '1.1',
			},
		},
		h2: {
			typography: {
				fontSize: '40px',
				lineHeight: '1.3',
			},
		},
	},
	blocks: {
		'core/button': {
			color: {
				background: '#D1D1E4',
				text: '#D1E4DD',
			},
			typography: {
				fontSize: '18px',
			},
		},
		'core/separator': {
			color: {
				text: '#cf1594',
			},
		},
	},
};

const RAW_FEATURES = {
	color: {
		palette: {
			default: [
				{
					name: 'Black',
					slug: 'black',
					color: '#000000',
				},
				{
					name: 'Cyan bluish gray',
					slug: 'cyan-bluish-gray',
					color: '#abb8c3',
				},
				{
					name: 'White',
					slug: 'white',
					color: '#ffffff',
				},
			],
			theme: [
				{
					slug: 'green',
					color: '#D1E4DD',
					name: 'Green',
				},
				{
					slug: 'blue',
					color: '#D1DFE4',
					name: 'Blue',
				},
				{
					slug: 'purple',
					color: '#D1D1E4',
					name: 'Purple',
				},
			],
			custom: [
				{
					color: '#1bf5c1',
					name: 'Color 1 ',
					slug: 'custom-color-1',
				},
				{
					color: '#cf1594',
					name: 'Color 2 ',
					slug: 'custom-color-2',
				},
			],
		},
		gradients: {
			default: [
				{
					name: 'Vivid cyan blue to vivid purple',
					gradient:
						'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
					slug: 'vivid-cyan-blue-to-vivid-purple',
				},
				{
					name: 'Light green cyan to vivid green cyan',
					gradient:
						'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
					slug: 'light-green-cyan-to-vivid-green-cyan',
				},
			],
			theme: [
				{
					slug: 'purple-to-blue',
					gradient: 'linear-gradient(160deg, #D1D1E4, #D1DFE4)',
					name: 'Purple to Blue',
				},
				{
					slug: 'green-to-purple',
					gradient: 'linear-gradient(160deg, #D1E4DD, #D1D1E4)',
					name: 'Green to Purple',
				},
			],
		},
	},
	typography: {
		fontSizes: {
			theme: [
				{
					name: 'Normal',
					slug: 'normal',
					size: '18px',
					sizePx: '18px',
				},
				{
					slug: 'extra-large',
					size: '40px',
					sizePx: '40px',
					name: 'Extra large',
				},
				{
					slug: 'gigantic',
					size: '144px',
					sizePx: '144px',
					name: 'Gigantic',
				},
			],
		},
	},
	custom: {
		'line-height': {
			body: 1.7,
			heading: 1.3,
			'page-title': 1.1,
		},
	},
};

const MAPPED_VALUES = {
	color: {
		values: GLOBAL_STYLES_PALETTE,
		slug: 'color',
	},
	'font-size': {
		values: RAW_FEATURES.typography.fontSizes.theme,
		slug: 'size',
	},
};

describe( 'getBlockPaddings', () => {
	const PADDING = 12;

	it( 'returns no paddings for a block without background color', () => {
		const paddings = getBlockPaddings(
			{ color: 'red' },
			{ backgroundColor: 'red' },
			{ textColor: 'primary' }
		);
		expect( paddings ).toEqual( expect.objectContaining( {} ) );
	} );

	it( 'returns paddings for a block with background color', () => {
		const paddings = getBlockPaddings(
			{ color: 'red' },
			{},
			{ backgroundColor: 'red', textColor: 'primary' }
		);
		expect( paddings ).toEqual(
			expect.objectContaining( { padding: PADDING } )
		);
	} );

	it( 'returns no paddings for an inner block without background color within a parent block with background color', () => {
		const paddings = getBlockPaddings(
			{ backgroundColor: 'blue', color: 'yellow', padding: PADDING },
			{},
			{ textColor: 'primary' }
		);

		expect( paddings ).toEqual(
			expect.not.objectContaining( { padding: PADDING } )
		);
	} );
} );

describe( 'getBlockColors', () => {
	it( 'returns the theme colors correctly', () => {
		const blockColors = getBlockColors(
			{ backgroundColor: 'accent', textColor: 'secondary' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				backgroundColor: '#cd2653',
				color: '#6d6d6d',
			} )
		);
	} );

	it( 'returns custom background color correctly', () => {
		const blockColors = getBlockColors(
			{ backgroundColor: '#222222', textColor: 'accent' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				backgroundColor: '#222222',
				color: '#cd2653',
			} )
		);
	} );

	it( 'returns custom text color correctly', () => {
		const blockColors = getBlockColors(
			{ textColor: '#4ddddd' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				color: '#4ddddd',
			} )
		);
	} );
} );

describe( 'parseStylesVariables', () => {
	it( 'returns the parsed preset values correctly', () => {
		const customValues = parseStylesVariables(
			JSON.stringify( RAW_FEATURES.custom ),
			MAPPED_VALUES
		);
		const blockColors = parseStylesVariables(
			JSON.stringify( DEFAULT_GLOBAL_STYLES ),
			MAPPED_VALUES,
			customValues
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( PARSED_GLOBAL_STYLES )
		);
	} );

	it( 'returns the parsed custom color values correctly', () => {
		const defaultStyles = {
			...DEFAULT_GLOBAL_STYLES,
			color: {
				text: 'var(--wp--custom--color--blue)',
				background: 'var(--wp--custom--color--green)',
			},
		};
		const customValues = parseStylesVariables(
			JSON.stringify( RAW_FEATURES.custom ),
			MAPPED_VALUES
		);
		const styles = parseStylesVariables(
			JSON.stringify( defaultStyles ),
			MAPPED_VALUES,
			customValues
		);
		expect( styles ).toEqual(
			expect.objectContaining( PARSED_GLOBAL_STYLES )
		);
	} );
} );

describe( 'getGlobalStyles', () => {
	it( 'returns the global styles data correctly', () => {
		const rawFeatures = JSON.stringify( RAW_FEATURES );
		const gradients = parseStylesVariables(
			JSON.stringify( GLOBAL_STYLES_GRADIENTS ),
			MAPPED_VALUES
		);

		const globalStyles = getGlobalStyles(
			JSON.stringify( DEFAULT_GLOBAL_STYLES ),
			rawFeatures
		);

		expect( globalStyles ).toEqual(
			expect.objectContaining( {
				__experimentalFeatures: {
					blocks: {},
					color: {
						palette: RAW_FEATURES.color.palette,
						gradients,
						text: true,
						background: true,
						defaultPalette: true,
						defaultGradients: true,
					},
					typography: {
						fontSizes: RAW_FEATURES.typography.fontSizes,
						customLineHeight: RAW_FEATURES.custom[ 'line-height' ],
					},
				},
				__experimentalGlobalStylesBaseStyles: PARSED_GLOBAL_STYLES,
			} )
		);
	} );
} );
