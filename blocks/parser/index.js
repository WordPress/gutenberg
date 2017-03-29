/**
 * External dependencies
 */
import * as query from 'hpq';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockSettings } from '../registration';

/**
 * Returns the block attributes of a registered block node given its settings.
 *
 * @param  {Object}   blockNode     Parsed block node
 * @param  {Object}   blockSettings Block settings
 * @return {Object}                 Block state, or undefined if type unknown
 */
export function getBlockAttributes( blockNode, blockSettings ) {
	const { rawContent } = blockNode;

	// Merge attributes from parse with block implementation
	let { attrs } = blockNode;
	if ( 'function' === typeof blockSettings.attributes ) {
		attrs = { ...attrs, ...blockSettings.attributes( rawContent ) };
	} else if ( blockSettings.attributes ) {
		attrs = { ...attrs, ...query.parse( rawContent, blockSettings.attributes ) };
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
		const settings = getBlockSettings( blockNode.blockType );

		if ( settings ) {
			memo.push( {
				blockType: blockNode.blockType,
				attributes: getBlockAttributes( blockNode, settings )
			} );
		}

		return memo;
	}, [] );
}
