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
];

export const LINK_COLOR = '--wp--style--color--link';

export const STYLE_PROPERTY = {
	[ LINK_COLOR ]: [ 'color', 'link' ],
	background: [ 'color', 'gradient' ],
	backgroundColor: [ 'color', 'background' ],
	color: [ 'color', 'text' ],
	fontSize: [ 'typography', 'fontSize' ],
	lineHeight: [ 'typography', 'lineHeight' ],
	paddingBottom: [ 'spacing', 'padding', 'bottom' ],
	paddingLeft: [ 'spacing', 'padding', 'left' ],
	paddingRight: [ 'spacing', 'padding', 'right' ],
	paddingTop: [ 'spacing', 'padding', 'top' ],
};

/* Block supports */
export const COLOR_SUPPORT_KEY = '__experimentalColor';
export const FONT_SIZE_SUPPORT_KEY = '__experimentalFontSize';
export const LINE_HEIGHT_SUPPORT_KEY = '__experimentalLineHeight';
export const PADDING_SUPPORT_KEY = '__experimentalPadding';
