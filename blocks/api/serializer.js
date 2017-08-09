/**
 * External dependencies
 */
import { isEmpty, reduce, isObject } from 'lodash';
import { html as beautifyHtml } from 'js-beautify';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createElement, renderToString, cloneElement, Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getBlockType } from './registration';

/**
 * Returns the block's default classname from its name
 *
 * @param {String}   blockName  The block name
 * @return {string}             The block's default class
 */
export function getBlockDefaultClassname( blockName ) {
	// Drop common prefixes: 'core/' or 'core-' (in 'core-embed/')
	return 'wp-block-' + blockName.replace( /\//, '-' ).replace( /^core-/, '' );
}

/**
 * Given a block type containg a save render implementation and attributes, returns the
 * static markup to be saved.
 *
 * @param  {Object}               blockType  Block type
 * @param  {Object}               attributes Block attributes
 * @return {string}                          Save content
 */
export function getSaveContent( blockType, attributes ) {
	const { save, className = getBlockDefaultClassname( blockType.name ) } = blockType;
	let rawContent;

	if ( save.prototype instanceof Component ) {
		rawContent = createElement( save, { attributes } );
	} else {
		rawContent = save( { attributes } );

		// Special-case function render implementation to allow raw HTML return
		if ( 'string' === typeof rawContent ) {
			return rawContent;
		}
	}

	// Adding a generic classname
	const addClassnameToElement = ( element ) => {
		if ( ! element || ! isObject( element ) || ! className ) {
			return element;
		}

		const updatedClassName = classnames(
			className,
			element.props.className,
			attributes.className
		);

		return cloneElement( element, { className: updatedClassName } );
	};
	const contentWithClassname = Children.map( rawContent, addClassnameToElement );

	// Otherwise, infer as element
	return renderToString( contentWithClassname );
}

/**
 * Returns attributes which are to be saved and serialized into the block
 * comment delimiter.
 *
 * When a block exists in memory it contains as its attributes both those
 * parsed the block comment delimiter _and_ those which matched from the
 * contents of the block.
 *
 * This function returns only those attributes which are needed to persist and
 * which cannot be matched from the block content.
 *
 * @param   {Object<String,*>} allAttributes Attributes from in-memory block data
 * @param   {Object<String,*>} schema        Block type schema
 * @returns {Object<String,*>}               Subset of attributes for comment serialization
 */
export function getCommentAttributes( allAttributes, schema ) {
	return reduce( schema, ( result, attributeSchema, key ) => {
		const value = allAttributes[ key ];

		// Ignore undefined values
		if ( undefined === value ) {
			return result;
		}

		// Ignore values sources from content
		if ( attributeSchema.source ) {
			return result;
		}

		// Ignore default value
		if ( 'default' in attributeSchema && attributeSchema.default === value ) {
			return result;
		}

		// Otherwise, include in comment set
		result[ key ] = value;
		return result;
	}, {} );
}

export function serializeAttributes( attrs ) {
	return JSON.stringify( attrs )
		.replace( /--/g, '\\u002d\\u002d' ) // don't break HTML comments
		.replace( /</g, '\\u003c' ) // don't break standard-non-compliant tools
		.replace( />/g, '\\u003e' ) // ibid
		.replace( /&/g, '\\u0026' ); // ibid
}

/**
 * Returns HTML markup processed by a markup beautifier configured for use in
 * block serialization.
 *
 * @param  {String} content Original HTML
 * @return {String}         Beautiful HTML
 */
export function getBeautifulContent( content ) {
	return beautifyHtml( content, {
		indent_inner_html: true,
		wrap_line_length: 0,
	} );
}

export function serializeBlock( block ) {
	const blockName = block.name;
	const blockType = getBlockType( blockName );

	let saveContent;
	if ( block.isValid ) {
		saveContent = getSaveContent( blockType, block.attributes );
	} else {
		// If block was parsed as invalid, skip serialization behavior and opt
		// to use original content instead so we don't destroy user content.
		saveContent = block.originalContent;
	}

	const saveAttributes = getCommentAttributes( block.attributes, blockType.attributes );

	if ( 'core/more' === blockName ) {
		return `<!--more${ saveAttributes.text ? ` ${ saveAttributes.text }` : '' }-->${ saveAttributes.noTeaser ? '\n<!--noteaser-->' : '' }`;
	}

	const serializedAttributes = ! isEmpty( saveAttributes )
		? serializeAttributes( saveAttributes ) + ' '
		: '';

	if ( ! saveContent ) {
		return `<!-- wp:${ blockName } ${ serializedAttributes }/-->`;
	}

	return (
		`<!-- wp:${ blockName } ${ serializedAttributes }-->\n` +
		getBeautifulContent( saveContent ) +
		`\n<!-- /wp:${ blockName } -->`
	);
}

/**
 * Takes a block list and returns the serialized post content.
 *
 * @param  {Array}  blocks Block list
 * @return {String}        The post content
 */
export default function serialize( blocks ) {
	return blocks.map( serializeBlock ).join( '\n\n' );
}
