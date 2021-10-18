/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';

const v1 = {
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
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 * They also need to contain the old deprecations.
 *
 * See block-deprecation.md
 */
export default [ v1 ];
