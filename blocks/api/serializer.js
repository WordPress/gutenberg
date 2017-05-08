/**
 * External dependencies
 */
import { reduce } from 'lodash';
import { html as beautifyHtml } from 'js-beautify';

/**
 * Internal dependencies
 */
import { getBlockSettings } from './registration';

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
 * Returns comment attributes as serialized string
 *
 * @param  {Object} settings    Block settings
 * @param  {Object} attributes  Block attributes
 * @return {string}             Comment attributes
 */
export function getCommentAttributes( settings, attributes ) {
	// Serialize the comment attributes
	return reduce( settings.attributes, ( memo, attribute, key ) => {
		const value = attributes[ key ];
		if ( attribute.source === 'metadata' && value !== undefined ) {
			return memo + `${ attribute.name || key }="${ value }" `;
		}

		return memo;
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
		const saveContent = getSaveContent( settings.save, block.attributes );
		const beautifyOptions = {
			indent_inner_html: true,
			wrap_line_length: 0
		};

		return memo + (
			'<!-- wp:' +
			blockType +
			' ' +
			getCommentAttributes(
				settings,
				block.attributes,
			) +
			'-->' +
			( saveContent ? '\n' + beautifyHtml( saveContent, beautifyOptions ) + '\n' : '' ) +
			'<!-- /wp:' +
			blockType +
			' -->'
		) + '\n\n';
	}, '' );
}
