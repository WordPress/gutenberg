/**
 * Internal dependencies
 */
import oldFontFamilyMigration from '../utils/old-font-family-migration';

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
