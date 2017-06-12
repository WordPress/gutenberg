/**
 * External dependencies
 */
import { isEmpty, map, reduce, some } from 'lodash';
import { html as beautifyHtml } from 'js-beautify';

/**
 * Internal dependencies
 */
import { getBlockType } from './registration';
import { parseBlockAttributes } from './parser';

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
 * Returns attributes which ought to be saved and serialized
 *
 * When a block exists in memory it contains as its attributes
 * both those which come from the block comment opening _and_
 * those which come from parsing the contents of the block.
 * Additionally they may live in a form fine for memory but
 * which isn't valid for serialization.
 *
 * This function returns a filtered set of attributes which are
 * the ones which need to be saved in order to ensure a full
 * serialization and they are in a form which is safe to store.
 *
 * @param {Object<String,*>}   allAttributes Attributes from in-memory block data
 * @param {Object<String,*>}   fromContent   Attributes which are inferred from block content
 * @returns {Object<String,*>} filtered set of attributes for minimum safe save/serialization
 */
export function attributesToSave( allAttributes, fromContent ) {
	// Reasons an attribute need not be saved
	const canBeInferred = key => fromContent.hasOwnProperty( key );
	const isUndefined = key => undefined === allAttributes[ key ];

	const isValid = key => ! some( [
		isUndefined,
		canBeInferred,
	], f => f( key ) );

	// Specific ways we need to transform the values of saved attributes
	const escapeDoubleQuotes = value => 'string' === typeof value
		? value.replace( '"', '\"' )
		: value;

	const transform = key => escapeDoubleQuotes( allAttributes[ key ] );

	// Iterate over attributes and produce the set to save
	return reduce(
		Object.keys( allAttributes ),
		( toSave, key ) => Object.assign( toSave, isValid( key ) && { [ key ]: transform( key ) } ),
		{},
	);
}

/**
 * Takes a block list and returns the serialized post content.
 *
 * @param  {Array}  blocks Block list
 * @return {String}        The post content
 */
export default function serialize( blocks ) {
	return blocks
		.map( block => {
		const blockName = block.name;
		const blockType = getBlockType( blockName );
		const saveContent = getSaveContent( blockType.save, block.attributes );
			const saveAttributes = attributesToSave( block.attributes, parseBlockAttributes( saveContent, blockType ) );

		const beautifyOptions = {
			indent_inner_html: true,
			wrap_line_length: 0,
		};

			const serializedAttributes = ! isEmpty( saveAttributes )
				? map( saveAttributes, ( value, key ) => `${ key }="${ value }"` ).join( ' ' ) + ' '
				: '';

		if ( ! saveContent ) {
				return `<!-- wp:${ blockName } ${ serializedAttributes }--><!-- /wp:${ blockName } -->`;
		}

			return [
				`<!-- wp:${ blockName } ${ serializedAttributes } -->`,
				beautifyHtml( saveContent, beautifyOptions ),
				`<!-- /wp:${ blockName } -->`,
			].join( '\n' );
		} )
		.join( '\n\n' );
}
