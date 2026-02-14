/**
 * Internal dependencies
 */
import migrateTextAlign from '../utils/migrate-text-align';

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		displayAsRange: {
			type: 'boolean',
			default: true,
		},
		displayMode: {
			type: 'string',
			default: 'time',
		},
		averageReadingSpeed: {
			type: 'number',
			default: 189,
		},
	},
	supports: {
		anchor: true,
		color: {
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		html: false,
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
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
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
