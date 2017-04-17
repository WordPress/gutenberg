/**
 * External dependencies
 */
import * as query from 'hpq';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockSettings, getUnknownTypeHandler } from './registration';
import { createBlock } from './factory';

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent    Raw block content
 * @param  {Object} blockSettings Block settings
 * @return {Object}               Block attributes
 */
export function parseBlockAttributes( rawContent, blockSettings ) {
	if ( 'function' === typeof blockSettings.attributes ) {
		return blockSettings.attributes( rawContent );
	} else if ( blockSettings.attributes ) {
		return query.parse( rawContent, blockSettings.attributes );
	}

	return {};
}

/**
 * Returns the block attributes of a registered block node given its settings.
 *
 * @param  {Object} blockNode     Parsed block node
 * @param  {Object} blockSettings Block settings
 * @return {Object}               Block attributes
 */
export function getBlockAttributes( blockNode, blockSettings ) {
	const { rawContent } = blockNode;
	// Merge attributes from parse with block implementation
	let { attrs } = blockNode;
	if ( blockSettings ) {
		attrs = { ...attrs, ...parseBlockAttributes( rawContent, blockSettings ) };
	}

	return attrs;
}

/**
 * Returns a list of blocks extracted from the Post Content
 *
 * @param  {String} content The post content
 * @return {Array}          Block list
 */
export default function parse( content ) {
	return grammarParse( content ).reduce( ( memo, blockNode ) => {
		// Use type from block node, otherwise find unknown handler
		let { blockType = getUnknownTypeHandler() } = blockNode;

		// Try finding settings for known block type, else again fall back
		let settings = getBlockSettings( blockType );
		if ( ! settings ) {
			blockType = getUnknownTypeHandler();
			settings = getBlockSettings( blockType );
		}

		// Include in set only if settings were determined
		if ( settings ) {
			memo.push(
				createBlock( blockType, getBlockAttributes( blockNode, settings ) )
			);
		}

		return memo;
	}, [] );
}
