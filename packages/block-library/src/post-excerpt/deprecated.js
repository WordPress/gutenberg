/**
 * Internal dependencies
 */
import migrateTextAlign from '../utils/migrate-text-align';

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		moreText: {
			type: 'string',
			role: 'content',
		},
		showMoreOnNewLine: {
			type: 'boolean',
			default: true,
		},
		excerptLength: {
			type: 'number',
			default: 55,
		},
	},
	supports: {
		anchor: true,
		html: false,
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				link: true,
			},
		},
		spacing: {
			margin: true,
			padding: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			textColumns: true,
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
			__experimentalDefaultControls: {
				radius: true,
				color: true,
				width: true,
				style: true,
			},
		},
	},
	save() {
		return null;
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
};

export default [ v1 ];
