/**
 * External dependencies
 */
import { reduce } from 'lodash';
import { html as beautifyHtml } from 'js-beautify';

/**
 * Internal dependencies
 */
import { getBlockType } from './registration';

/**
 * Given a block's save render implementation and attributes, returns the
 * static markup to be saved.
 *
 * @param  {Function|WPComponent} save       Save render implementation
 * @param  {Object}               attributes Block attributes
 * @return {string}                          Save content
 */
export function getSaveContent( save, attributes ) {
	let rawContent;

	if ( save.prototype instanceof wp.element.Component ) {
		rawContent = wp.element.createElement( save, { attributes } );
	} else {
		rawContent = save( { attributes } );

		// Special-case function render implementation to allow raw HTML return
		if ( 'string' === typeof rawContent ) {
			return rawContent;
		}
	}

	// Otherwise, infer as element
	return wp.element.renderToString( rawContent );
}

/**
 * Returns comment attributes as serialized string, determined by the return
 * value object of the block's `encodeAttributes` implementation. If a block
 * does not provide an implementation, an empty string is returned.
 *
 * @param  {?Function} encodeAttributes Attribute encoding implementation
 * @param  {Object}    attributes       Block attributes
 * @return {String}                     Comment attributes
 */
export function getCommentAttributes( encodeAttributes, attributes ) {
	let encodedAttributes;
	if ( encodeAttributes ) {
		encodedAttributes = encodeAttributes( attributes );
	}

	// Serialize the comment attributes as `key="value"`.
	return reduce( encodedAttributes, ( result, value, key ) => {
		if ( undefined !== value ) {
			result.push( `${ key }="${ value }"` );
		}

		return result;
	}, [] ).join( ' ' );
}

/**
 * Takes a block list and returns the serialized post content.
 *
 * @param  {Array}  blocks Block list
 * @return {String}        The post content
 */
export default function serialize( blocks ) {
	return blocks.reduce( ( memo, block ) => {
		const blockName = block.name;
		const blockType = getBlockType( blockName );
		const saveContent = getSaveContent( blockType.save, block.attributes );
		const commentAttributes = getCommentAttributes( blockType.encodeAttributes, block.attributes );
		const beautifyOptions = {
			indent_inner_html: true,
			wrap_line_length: 0,
		};

		return memo + (
			'<!-- wp:' +
			blockName +
			' ' +
			( commentAttributes ? commentAttributes + ' ' : '' ) +
			'-->' +
			( saveContent ? '\n' + beautifyHtml( saveContent, beautifyOptions ) + '\n' : '' ) +
			'<!-- /wp:' +
			blockName +
			' -->'
		) + '\n\n';
	}, '' );
}
