/**
 * External dependencies
 */
import * as query from 'hpq';

/**
 * Internal dependencies
 */
import { getBlockSettings } from './registration';

/**
 * Takes a block list and returns the serialized post content
 *
 * @param  {Array}  blocks Block list
 * @return {String}        The post content
 */
export default function serialize( blocks ) {
	return blocks.reduce( ( memo, block ) => {
		const blockType = block.blockType;
		const blockSettings = getBlockSettings( blockType );

		// static content, to be rendered inside the block comment
		const rawContent = wp.element.renderToString(
			blockSettings.save( { attributes: block.attributes } )
		);

		// To compute the blocks attributes we need serialize as comment attributes
		// We take all the block attributes and exclude the block attributes computed
		// using the `attributes` from the Block Settings.
		let contentAttributes = {};
		if ( 'function' === typeof blockSettings.attributes ) {
			contentAttributes = blockSettings.attributes( rawContent );
		} else if ( blockSettings.attributes ) {
			contentAttributes = query.parse( rawContent, blockSettings.attributes );
		}
		const commentAttributes = Object.keys( block.attributes ).reduce( ( attrs, attribute ) => {
			if ( attribute in contentAttributes ) {
				return attrs;
			}
			attrs.push( { key: attribute, value: block.attributes[ attribute ] } );
			return attrs;
		}, [] );

		// serialize the comment attributes
		const serializedCommentAttributes = commentAttributes.map( ( { key, value } ) => `${ key }:${ value } ` ).join( '' );

		return memo + `<!-- wp:${ blockType } ${ serializedCommentAttributes }-->${ rawContent }<!-- /wp:${ blockType } -->`;
	}, '' );
}
