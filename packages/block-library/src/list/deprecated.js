/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import { migrateToListV2, migrateTypeToInlineStyle } from './utils';

const v0 = {
	attributes: {
		ordered: {
			type: 'boolean',
			default: false,
			role: 'content',
		},
		values: {
			type: 'string',
			source: 'html',
			selector: 'ol,ul',
			multiline: 'li',
			__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
			default: '',
			role: 'content',
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
			role: 'content',
		},
		values: {
			type: 'string',
			source: 'html',
			selector: 'ol,ul',
			multiline: 'li',
			__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
			default: '',
			role: 'content',
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

// In #53301 changed to use the inline style instead of type attribute.
const v2 = {
	attributes: {
		ordered: {
			type: 'boolean',
			default: false,
			role: 'content',
		},
		values: {
			type: 'string',
			source: 'html',
			selector: 'ol,ul',
			multiline: 'li',
			__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
			default: '',
			role: 'content',
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
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		spacing: {
			margin: true,
			padding: true,
			__experimentalDefaultControls: {
				margin: false,
				padding: false,
			},
		},
		__unstablePasteTextInline: true,
		__experimentalSelector: 'ol,ul',
		__experimentalSlashInserter: true,
	},
	isEligible( { type } ) {
		return !! type;
	},
	save( { attributes } ) {
		const { ordered, type, reversed, start } = attributes;
		const TagName = ordered ? 'ol' : 'ul';
		return (
			<TagName { ...useBlockProps.save( { type, reversed, start } ) }>
				<InnerBlocks.Content />
			</TagName>
		);
	},
	migrate: migrateTypeToInlineStyle,
};

// Version without block support 'className: true'.
const v3 = {
	attributes: {
		ordered: {
			type: 'boolean',
			default: false,
			role: 'content',
		},
		values: {
			type: 'string',
			source: 'html',
			selector: 'ol,ul',
			multiline: 'li',
			__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
			default: '',
			role: 'content',
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
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		spacing: {
			margin: true,
			padding: true,
			__experimentalDefaultControls: {
				margin: false,
				padding: false,
			},
		},
		__unstablePasteTextInline: true,
		__experimentalSelector: 'ol,ul',
		__experimentalOnMerge: 'true',
		__experimentalSlashInserter: true,
	},
	save( { attributes } ) {
		const { ordered, type, reversed, start } = attributes;
		const TagName = ordered ? 'ol' : 'ul';
		return (
			<TagName
				{ ...useBlockProps.save( {
					reversed,
					start,
					style: {
						listStyleType:
							ordered && type !== 'decimal' ? type : undefined,
					},
				} ) }
			>
				<InnerBlocks.Content />
			</TagName>
		);
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
export default [ v3, v2, v1, v0 ];
