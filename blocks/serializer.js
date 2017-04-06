/**
 * External dependencies
 */
import { difference } from 'lodash';

/**
 * Internal dependencies
 */
import { getBlockSettings } from './registration';
import { getBlockAttributes } from './parser';

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
 * Returns comment attributes as serialized string, determined by subset of
 * difference between actual attributes of a block and those expected based
 * on its settings.
 *
 * @param  {Object} realAttributes     Actual block attributes
 * @param  {Object} expectedAttributes Expected block attributes
 * @return {string}                    Comment attributes
 */
export function getCommentAttributes( realAttributes, expectedAttributes ) {
	// Find difference and build into object subset of attributes.
	const keys = difference(
		Object.keys( realAttributes ),
		Object.keys( expectedAttributes )
	);

	// Serialize the comment attributes
	return keys.reduce( ( memo, key ) => {
		const value = realAttributes[ key ];
		return memo + `${ key }:${ value } `;
	}, '' );
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

		return memo + (
			'<!-- wp:' +
			blockType +
			' ' +
			getCommentAttributes(
				block.attributes,
				getBlockAttributes( block, settings )
			) +
			'-->' +
			getSaveContent( settings.save, block.attributes ) +
			'<!-- /wp:' +
			blockType +
			' -->'
		);
	}, '' );
}
