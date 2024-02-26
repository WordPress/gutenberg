export const DEFAULT_COLORS = [
	{ color: '#cd2653', name: 'Accent Color', slug: 'accent' },
	{ color: '#000000', name: 'Primary', slug: 'primary' },
	{ color: '#6d6d6d', name: 'Secondary', slug: 'secondary' },
];

export const GLOBAL_STYLES_PALETTE = [
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

export const GLOBAL_STYLES_GRADIENTS = {
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

export const DEFAULT_GLOBAL_STYLES = {
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

export const PARSED_GLOBAL_STYLES = {
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

export const RAW_FEATURES = {
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

export const MAPPED_VALUES = {
	color: {
		values: GLOBAL_STYLES_PALETTE,
		slug: 'color',
	},
	'font-size': {
		values: RAW_FEATURES.typography.fontSizes.theme,
		slug: 'size',
	},
};
