/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';

const deprecated = [
	{
		attributes: {
			level: {
				type: 'number',
				default: 1,
			},
			textAlign: {
				type: 'string',
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			html: false,
			color: {
				gradients: true,
				text: false,
				link: true,
			},
			spacing: {
				padding: true,
				margin: true,
			},
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontFamily: true,
				__experimentalTextTransform: true,
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
				__experimentalLetterSpacing: true,
			},
		},
		save() {
			return null;
		},
		migrate: migrateFontFamily,
		isEligible( { style } ) {
			return style?.typography?.fontFamily;
		},
	},
];

export default deprecated;
