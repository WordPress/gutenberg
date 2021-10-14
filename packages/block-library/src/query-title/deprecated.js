/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';

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
		migrate: migrateFontFamily,
		isEligible( { style } ) {
			return style?.typography?.fontFamily;
		},
	},
];

export default deprecated;
