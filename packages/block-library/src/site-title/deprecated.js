/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import migrateTextAlign from '../utils/migrate-text-align';

const v2 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		level: {
			type: 'number',
			default: 1,
		},
		levelOptions: {
			type: 'array',
			default: [ 0, 1, 2, 3, 4, 5, 6 ],
		},
		isLink: {
			type: 'boolean',
			default: true,
			role: 'content',
		},
		linkTarget: {
			type: 'string',
			default: '_self',
			role: 'content',
		},
	},
	supports: {
		anchor: true,
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
			padding: true,
			margin: true,
			__experimentalDefaultControls: {
				margin: false,
				padding: false,
			},
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalLetterSpacing: true,
			__experimentalWritingMode: true,
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

const v1 = {
	attributes: {
		level: {
			type: 'number',
			default: 1,
		},
		textAlign: {
			type: 'string',
		},
		isLink: {
			type: 'boolean',
			default: true,
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
