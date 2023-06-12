/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import { migrateToListV2 } from './utils';

const v0 = {
	attributes: {
		ordered: {
			type: 'boolean',
			default: false,
			__experimentalRole: 'content',
		},
		values: {
			type: 'string',
			source: 'html',
			selector: 'ol,ul',
			multiline: 'li',
			__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
			default: '',
			__experimentalRole: 'content',
		},
		type: {
			type: 'string',
		},
		start: {
			type: 'number',
		},
		reversed: {
			type: 'boolean',
		},
		placeholder: {
			type: 'string',
		},
	},
	supports: {
		anchor: true,
		className: false,
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
		},
		color: {
			gradients: true,
			link: true,
		},
		__unstablePasteTextInline: true,
		__experimentalSelector: 'ol,ul',
		__experimentalSlashInserter: true,
	},
	save( { attributes } ) {
		const { ordered, values, type, reversed, start } = attributes;
		const TagName = ordered ? 'ol' : 'ul';

		return (
			<TagName { ...useBlockProps.save( { type, reversed, start } ) }>
				<RichText.Content value={ values } multiline="li" />
			</TagName>
		);
	},
	migrate: migrateFontFamily,
	isEligible( { style } ) {
		return style?.typography?.fontFamily;
	},
};

const v1 = {
	attributes: {
		ordered: {
			type: 'boolean',
			default: false,
			__experimentalRole: 'content',
		},
		values: {
			type: 'string',
			source: 'html',
			selector: 'ol,ul',
			multiline: 'li',
			__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
			default: '',
			__experimentalRole: 'content',
		},
		type: {
			type: 'string',
		},
		start: {
			type: 'number',
		},
		reversed: {
			type: 'boolean',
		},
		placeholder: {
			type: 'string',
		},
	},
	supports: {
		anchor: true,
		className: false,
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			lineHeight: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalLetterSpacing: true,
			__experimentalTextTransform: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		__unstablePasteTextInline: true,
		__experimentalSelector: 'ol,ul',
		__experimentalSlashInserter: true,
	},
	save( { attributes } ) {
		const { ordered, values, type, reversed, start } = attributes;
		const TagName = ordered ? 'ol' : 'ul';

		return (
			<TagName { ...useBlockProps.save( { type, reversed, start } ) }>
				<RichText.Content value={ values } multiline="li" />
			</TagName>
		);
	},
	migrate: migrateToListV2,
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v1, v0 ];
