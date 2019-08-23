/**
 * Internal dependencies
 */
const dashIconsData = require( '../data/dashicons-codepoints.json' );

const excludedIcons = [
	'arrow-up-duplicate',
	'businessperson',
	'businesswoman',
	'camera-alt',
	'code-standards',
	'color-picker',
	'edit-large',
	'editor-code-duplicate',
	'lock-duplicate',
	'menu-alt2',
	'menu-alt3',
	'plugins-checked',
	'plus-alt2',
	'share1',
	'text-page',
	'twitter-alt',
	'update-alt',
];

function getIcons() {
	return Object.keys( dashIconsData )
		.sort()
		.filter( ( icon ) => {
			return ! excludedIcons.includes( icon );
		} );
}

exports.getIcons = getIcons;
