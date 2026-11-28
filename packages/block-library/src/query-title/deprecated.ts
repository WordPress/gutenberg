import type { BlockAlignment } from '@wordpress/blocks';
import migrateFontFamily from '../utils/migrate-font-family';
import migrateTextAlign from '../utils/migrate-text-align';
import type { StyledBlockAttributes } from '../utils/types';
import type { QueryTitleAttributes } from './types';

const v2 = {
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
		levelOptions: {
			type: 'array',
		},
	},
	supports: {
		anchor: true,
		align: [ 'wide', 'full' ] as BlockAlignment[],
		html: false,
		color: {
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
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
			__experimentalTextDecoration: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
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
	migrate: migrateTextAlign,
	isEligible( attributes: QueryTitleAttributes ) {
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
		align: [ 'wide', 'full' ] as BlockAlignment[],
		html: false,
		color: {
			gradients: true,
		},
		spacing: {
			margin: true,
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
	isEligible( { style }: StyledBlockAttributes ) {
		return !! style?.typography?.fontFamily;
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
