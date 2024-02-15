/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import withBlockBindingSupport from './with-block-binding-support';

export const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget' ],
};

export function isItPossibleToBindBlock( blockName ) {
	return blockName in BLOCK_BINDINGS_ALLOWED_BLOCKS;
}

export default function extendBlockWithBoundAttributes( settings, name ) {
	if ( ! isItPossibleToBindBlock( name ) ) {
		return settings;
	}

	return {
		...settings,
		/*
		 * Expose relevant data through
		 * the block context.
		 */
		usesContext: [
			...new Set( [
				...( settings.usesContext || [] ),
				'postId',
				'postType',
				'queryId',
			] ),
		],
		edit: withBlockBindingSupport( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/block-edit-with-binding-attributes',
	extendBlockWithBoundAttributes
);
