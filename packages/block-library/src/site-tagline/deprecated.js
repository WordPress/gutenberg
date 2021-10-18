/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
	},
	supports: {
		align: [ 'wide', 'full' ],
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
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 * They also need to contain the old deprecations.
 *
 * See block-deprecation.md
 */
export default [ v1 ];
