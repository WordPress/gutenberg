/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';

// Migrate the old level attribute (number) to the corresponding HTML tag (string).
const migrateLevel = ( attributes ) => {
	const { level, ...restAttributes } = attributes;
	return typeof level === 'number'
		? { ...restAttributes, level: 'h' + level }
		: attributes;
};

const v2 = {
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
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
				fontAppearance: true,
				textTransform: true,
			},
		},
	},
	save() {
		return null;
	},
	migrate: compose( migrateFontFamily, migrateLevel ),
	isEligible( attributes ) {
		if ( typeof attributes.level === 'number' ) {
			return true;
		}
		return false;
	},
};

const v1 = {
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
		spacing: {
			margin: true,
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
	migrate: compose( migrateFontFamily, migrateLevel ),
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
