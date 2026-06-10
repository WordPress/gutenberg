/**
 * Internal dependencies
 */
import migrateTextAlign from '../utils/migrate-text-align';

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		type: {
			type: 'string',
			default: 'next',
		},
		label: {
			type: 'string',
			role: 'content',
		},
		showTitle: {
			type: 'boolean',
			default: false,
		},
		linkLabel: {
			type: 'boolean',
			default: false,
		},
		arrow: {
			type: 'string',
			default: 'none',
		},
		taxonomy: {
			type: 'string',
			default: '',
		},
	},
	supports: {
		anchor: true,
		reusable: false,
		html: false,
		color: {
			link: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		interactivity: {
			clientNavigation: true,
		},
	},
	migrate: migrateTextAlign,
	isEligible( attributes ) {
		return (
			!! attributes.textAlign ||
			!! attributes.className?.match(
				/\bhas-text-align-(left|center|right)\b/
			)
		);
	},
	save: () => null,
};

export default [ v1 ];
