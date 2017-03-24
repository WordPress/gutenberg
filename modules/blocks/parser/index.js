/**
 * External dependencies
 */
import * as query from 'hpq';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockSettings } from '../';

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
 * @param  {String} postContent The post content
 * @return {Array}              Block list
 */
const parse = ( postContent ) => {
	const nodeBlocks = grammarParse( postContent );

	return nodeBlocks
		.map( ( blockNode ) => {
			return {
				blockSettings: getBlockSettings( blockNode.blockType ),
				blockNode
			};
		} )
		.filter( ( { blockSettings } ) => !! blockSettings )
		.map( ( { blockNode, blockSettings } ) => {
			return {
				blockType: blockNode.blockType,
				attributes: getBlockAttributes( blockNode, blockSettings )
			};
		} );
};

export default parse;
