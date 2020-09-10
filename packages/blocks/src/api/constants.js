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

export const __EXPERIMENTAL_LINK_COLOR = '--wp--style--color--link';

export const __EXPERIMENTAL_STYLE_PROPERTY = {
	[ __EXPERIMENTAL_LINK_COLOR ]: [ 'color', 'link' ],
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
