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
			level: {
				type: 'number',
				default: 2,
			},
			isLink: {
				type: 'boolean',
				default: false,
			},
			rel: {
				type: 'string',
				attribute: 'rel',
				default: '',
			},
			linkTarget: {
				type: 'string',
				default: '_self',
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			html: false,
			color: {
				gradients: true,
				link: true,
			},
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontFamily: true,
				__experimentalFontWeight: true,
				__experimentalFontStyle: true,
				__experimentalTextTransform: true,
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
