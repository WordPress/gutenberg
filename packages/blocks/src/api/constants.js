/**
 * Array of valid keys in a block type settings deprecation object.
 *
 * @type {string[]}
 */
export const DEPRECATED_ENTRY_KEYS = [
	'attributes',
	'supports',
	'save',
	'migrate',
	'isEligible',
	'apiVersion',
];

export const __EXPERIMENTAL_STYLE_PROPERTY = {
	//kept for back-compatibility purposes.
	'--wp--style--color--link': {
		value: [ 'color', 'link' ],
		support: [ 'color', 'link' ],
	},
	background: {
		value: [ 'color', 'gradient' ],
		support: [ 'color', 'gradients' ],
	},
	backgroundColor: {
		value: [ 'color', 'background' ],
		support: [ 'color' ],
	},
	borderColor: {
		value: [ 'border', 'color' ],
		support: [ '__experimentalBorder', 'color' ],
	},
	borderRadius: {
		value: [ 'border', 'radius' ],
		support: [ '__experimentalBorder', 'radius' ],
	},
	borderStyle: {
		value: [ 'border', 'style' ],
		support: [ '__experimentalBorder', 'style' ],
	},
	borderWidth: {
		value: [ 'border', 'width' ],
		support: [ '__experimentalBorder', 'width' ],
	},
	color: {
		value: [ 'color', 'text' ],
		support: [ 'color' ],
	},
	linkColor: {
		value: [ 'elements', 'link', 'color', 'text' ],
		support: [ 'color', 'link' ],
	},
	fontFamily: {
		value: [ 'typography', 'fontFamily' ],
		support: [ '__experimentalFontFamily' ],
	},
	fontSize: {
		value: [ 'typography', 'fontSize' ],
		support: [ 'fontSize' ],
	},
	fontStyle: {
		value: [ 'typography', 'fontStyle' ],
		support: [ '__experimentalFontStyle' ],
	},
	fontWeight: {
		value: [ 'typography', 'fontWeight' ],
		support: [ '__experimentalFontWeight' ],
	},
	height: {
		value: [ 'dimensions', 'height' ],
		support: [ '__experimentalDimensions', 'height' ],
	},
	lineHeight: {
		value: [ 'typography', 'lineHeight' ],
		support: [ 'lineHeight' ],
	},
	margin: {
		value: [ 'spacing', 'margin' ],
		support: [ 'spacing', 'margin' ],
		properties: [ 'top', 'right', 'bottom', 'left' ],
	},
	padding: {
		value: [ 'spacing', 'padding' ],
		support: [ 'spacing', 'padding' ],
		properties: [ 'top', 'right', 'bottom', 'left' ],
	},
	textDecoration: {
		value: [ 'typography', 'textDecoration' ],
		support: [ '__experimentalTextDecoration' ],
	},
	textTransform: {
		value: [ 'typography', 'textTransform' ],
		support: [ '__experimentalTextTransform' ],
	},
	letterSpacing: {
		value: [ 'typography', 'letterSpacing' ],
		support: [ '__experimentalLetterSpacing' ],
	},
	width: {
		value: [ 'dimensions', 'width' ],
		support: [ '__experimentalDimensions', 'width' ],
	},
};

export const __EXPERIMENTAL_ELEMENTS = {
	link: 'a',
	h1: 'h1',
	h2: 'h2',
	h3: 'h3',
	h4: 'h4',
	h5: 'h5',
	h6: 'h6',
};
