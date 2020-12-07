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
	color: {
		value: [ 'color', 'text' ],
		support: [ 'color' ],
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
	lineHeight: {
		value: [ 'typography', 'lineHeight' ],
		support: [ 'lineHeight' ],
	},
	paddingBottom: {
		value: [ 'spacing', 'padding', 'bottom' ],
		support: [ 'spacing', 'padding' ],
	},
	paddingLeft: {
		value: [ 'spacing', 'padding', 'left' ],
		support: [ 'spacing', 'padding' ],
	},
	paddingRight: {
		value: [ 'spacing', 'padding', 'right' ],
		support: [ 'spacing', 'padding' ],
	},
	paddingTop: {
		value: [ 'spacing', 'padding', 'top' ],
		support: [ 'spacing', 'padding' ],
	},
	textDecoration: {
		value: [ 'typography', 'textDecoration' ],
		support: [ '__experimentalTextDecoration' ],
	},
	textTransform: {
		value: [ 'typography', 'textTransform' ],
		support: [ '__experimentalTextTransform' ],
	},
};
