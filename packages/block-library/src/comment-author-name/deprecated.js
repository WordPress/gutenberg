/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import migrateTextAlign from '../utils/migrate-text-align';

const v2 = {
	attributes: {
		isLink: {
			type: 'boolean',
			default: true,
		},
		linkTarget: {
			type: 'string',
			default: '_self',
		},
		textAlign: {
			type: 'string',
		},
	},
	usesContext: [ 'commentId' ],
	supports: {
		html: false,
		spacing: {
			margin: true,
			padding: true,
		},
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
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
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

const v1 = {
	attributes: {
		isLink: {
			type: 'boolean',
			default: false,
		},
		linkTarget: {
			type: 'string',
			default: '_self',
		},
	},
	supports: {
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
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v2, v1 ];
