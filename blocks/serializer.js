/**
 * External dependencies
 */
import * as query from 'hpq';

/**
 * Internal dependencies
 */
import { getBlockSettings } from './registration';

/**
 * Given a block's save render implementation and attributes, returns the
 * static markup to be saved.
 *
 * @param  {Function} save       Save render implementation
 * @param  {Object}   attributes Block attributes
 * @return {string}              Save content
 */
export function getSaveContent( save, attributes ) {
	const rawContent = save( { attributes } );

	// Support string return values from save, e.g. raw HTML attribute value
	if ( 'string' === typeof rawContent ) {
		return rawContent;
	}

	// Otherwise, infer as element
	return wp.element.renderToString( rawContent );
}

/**
 * Takes a block list and returns the serialized post content
 *
 * @param  {Array}  blocks Block list
 * @return {String}        The post content
 */
export default function serialize( blocks ) {
	return blocks.reduce( ( memo, block ) => {
		const blockType = block.blockType;
		const settings = getBlockSettings( blockType );

		// Static content, to be rendered inside the block comment
		const rawContent = getSaveContent( settings.save, block.attributes );

		// To compute the blocks attributes we need serialize as comment attributes
		// We take all the block attributes and exclude the block attributes computed
		// using the `attributes` from the Block Settings.
		let contentAttributes = {};
		if ( 'function' === typeof settings.attributes ) {
			contentAttributes = settings.attributes( rawContent );
		} else if ( settings.attributes ) {
			contentAttributes = query.parse( rawContent, settings.attributes );
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
