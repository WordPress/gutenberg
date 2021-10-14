/**
 * Internal dependencies
 */
import oldFontFamilyMigration from '../utils/old-font-family-migration';

const deprecated = [
	{
		attributes: {
			textAlign: {
				type: 'string',
			},
		},
		supports: {
			html: false,
			color: {
				gradients: true,
			},
			spacing: {
				margin: true,
				padding: true,
			},
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontFamily: true,
				__experimentalFontWeight: true,
				__experimentalTextTransform: true,
				__experimentalLetterSpacing: true,
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
