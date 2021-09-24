/**
 * Internal dependencies
 */
import cleanEmptyObject from '../utils/clean-empty-object';

/**
 * Migrates the current style.typography.fontFamily attribute,
 * whose value was "var:preset|font-family|helvetica-arial",
 * to the style.fontFamily attribute, whose value will be "helvetica-arial".
 *
 * @param {Object} attributes The current attributes
 * @return {Object} The updated attributes.
 */
const oldFontFamilyMigration = ( attributes ) => {
	if ( ! attributes?.style?.typography?.fontFamily ) {
		return attributes;
	}

	const fontFamily = attributes.style.typography.fontFamily
		.split( '|' )
		.pop();
	delete attributes.style.typography.fontFamily;
	attributes.style = cleanEmptyObject( attributes.style );

	return {
		...attributes,
		fontFamily,
	};
};

const deprecated = [
	{
		attributes: {
			type: {
				type: 'string',
			},
			textAlign: {
				type: 'string',
			},
			level: {
				type: 'number',
				default: 1,
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			html: false,
			color: {
				gradients: true,
			},
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontFamily: true,
			},
		},
		save() {
			return null;
		},
		migrate: oldFontFamilyMigration,
		isEligible( { style } ) {
			return style?.typography?.fontFamily;
		},
	},
];

export default deprecated;
