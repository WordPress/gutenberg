/**
 * Internal dependencies
 */
import { createBlock } from '@wordpress/blocks';
import migrateFontFamily from '../utils/migrate-font-family';

const v0 = {
	name: 'core/post-comment-author',
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
	isEligible() {
		return true;
	},

	/**
	 * Migrate the block from the old structure to the new one.
	 *
	 * @param {import('@wordpress/blocks').BlockInstance} block The block to migrate.
	 * @return {import('@wordpress/blocks').BlockInstance} The migrated block.
	 */
	migrateBlock: ( block ) => {
		return createBlock(
			'core/comment-author-name',
			block.attributes,
			block.innerBlocks
		);
	},
};

const v1 = {
	name: 'core/comment-author-name',
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
export default [ v1 ];
