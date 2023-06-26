/**
 * WordPress dependencies
 */
import {
	Component,
	cloneElement,
	renderToString,
	RawHTML,
} from '@wordpress/element';
import { hasFilter, applyFilters } from '@wordpress/hooks';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { removep } from '@wordpress/autop';

/**
 * Internal dependencies
 */
import {
	getBlockType,
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
} from './registration';
import { serializeRawBlock } from './parser/serialize-raw-block';
import { isUnmodifiedDefaultBlock, normalizeBlockType } from './utils';

/** @typedef {import('./parser').WPBlock} WPBlock */

/**
 * @typedef {Object} WPBlockSerializationOptions Serialization Options.
 *
 * @property {boolean} isInnerBlocks Whether we are serializing inner blocks.
 */

/**
 * Returns the block's default classname from its name.
 *
 * @param {string} blockName The block name.
 *
 * @return {string} The block's default class.
 */
export function getBlockDefaultClassName( blockName ) {
	// Generated HTML classes for blocks follow the `wp-block-{name}` nomenclature.
	// Blocks provided by WordPress drop the prefixes 'core/' or 'core-' (historically used in 'core-embed/').
	const className =
		'wp-block-' + blockName.replace( /\//, '-' ).replace( /^core-/, '' );

	return applyFilters(
		'blocks.getBlockDefaultClassName',
		className,
		blockName
	);
}

/**
 * Returns the block's default menu item classname from its name.
 *
 * @param {string} blockName The block name.
 *
 * @return {string} The block's default menu item class.
 */
export function getBlockMenuDefaultClassName( blockName ) {
	// Generated HTML classes for blocks follow the `editor-block-list-item-{name}` nomenclature.
	// Blocks provided by WordPress drop the prefixes 'core/' or 'core-' (historically used in 'core-embed/').
	const className =
		'editor-block-list-item-' +
		blockName.replace( /\//, '-' ).replace( /^core-/, '' );

	return applyFilters(
		'blocks.getBlockMenuDefaultClassName',
		className,
		blockName
	);
}

const blockPropsProvider = {};
const innerBlocksPropsProvider = {};

/**
 * Call within a save function to get the props for the block wrapper.
 *
 * @param {Object} props Optional. Props to pass to the element.
 */
export function getBlockProps( props = {} ) {
	const { blockType, attributes } = blockPropsProvider;
	return getBlockProps.skipFilters
		? props
		: applyFilters(
				'blocks.getSaveContent.extraProps',
				{ ...props },
				blockType,
				attributes
		  );
}

/**
 * Call within a save function to get the props for the inner blocks wrapper.
 *
 * @param {Object} props Optional. Props to pass to the element.
 */
export function getInnerBlocksProps( props = {} ) {
	const { innerBlocks } = innerBlocksPropsProvider;
	const [ firstBlock ] = innerBlocks ?? [];
	if ( ! firstBlock ) return props;
	// If the innerBlocks passed to `getSaveElement` are not blocks but already
	// components, return the props as is. This is the case for
	// `getRichTextValues`.
	if ( ! firstBlock.clientId ) return { ...props, children: innerBlocks };
	// Value is an array of blocks, so defer to block serializer.
	const html = serialize( innerBlocks, { isInnerBlocks: true } );
	// Use special-cased raw HTML tag to avoid default escaping.
	const children = <RawHTML>{ html }</RawHTML>;

	return { ...props, children };
}

/**
 * Given a block type containing a save render implementation and attributes, returns the
 * enhanced element to be saved or string when raw HTML expected.
 *
 * @param {string|Object} blockTypeOrName Block type or name.
 * @param {Object}        attributes      Block attributes.
 * @param {?Array}        innerBlocks     Nested blocks.
 *
 * @return {Object|string} Save element or raw HTML string.
 */
export function getSaveElement(
	blockTypeOrName,
	attributes,
	innerBlocks = []
) {
	const blockType = normalizeBlockType( blockTypeOrName );

	if ( ! blockType?.save ) return null;

	let { save } = blockType;

	// Component classes are unsupported for save since serialization must
	// occur synchronously. For improved interoperability with higher-order
	// components which often return component class, emulate basic support.
	if ( save.prototype instanceof Component ) {
		const instance = new save( { attributes } );
		save = instance.render.bind( instance );
	}

	blockPropsProvider.blockType = blockType;
	blockPropsProvider.attributes = attributes;
	innerBlocksPropsProvider.innerBlocks = innerBlocks;

	let element = save( { attributes, innerBlocks } );

	if (
		element !== null &&
		typeof element === 'object' &&
		hasFilter( 'blocks.getSaveContent.extraProps' ) &&
		! ( blockType.apiVersion > 1 )
	) {
		/**
		 * Filters the props applied to the block save result element.
		 *
		 * @param {Object}  props      Props applied to save element.
		 * @param {WPBlock} blockType  Block type definition.
		 * @param {Object}  attributes Block attributes.
		 */
		const props = applyFilters(
			'blocks.getSaveContent.extraProps',
			{ ...element.props },
			blockType,
			attributes
		);

		if ( ! isShallowEqual( props, element.props ) ) {
			element = cloneElement( element, props );
		}
	}

	/**
	 * Filters the save result of a block during serialization.
	 *
	 * @param {WPElement} element    Block save result.
	 * @param {WPBlock}   blockType  Block type definition.
	 * @param {Object}    attributes Block attributes.
	 */
	return applyFilters(
		'blocks.getSaveElement',
		element,
		blockType,
		attributes
	);
}

/**
 * Given a block type containing a save render implementation and attributes, returns the
 * static markup to be saved.
 *
 * @param {string|Object} blockTypeOrName Block type or name.
 * @param {Object}        attributes      Block attributes.
 * @param {?Array}        innerBlocks     Nested blocks.
 *
 * @return {string} Save content.
 */
export function getSaveContent( blockTypeOrName, attributes, innerBlocks ) {
	const blockType = normalizeBlockType( blockTypeOrName );

	return renderToString(
		getSaveElement( blockType, attributes, innerBlocks )
	);
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
 * @param {Object<string,*>} blockType  Block type.
 * @param {Object<string,*>} attributes Attributes from in-memory block data.
 *
 * @return {Object<string,*>} Subset of attributes for comment serialization.
 */
export function getCommentAttributes( blockType, attributes ) {
	return Object.entries( blockType.attributes ?? {} ).reduce(
		( accumulator, [ key, attributeSchema ] ) => {
			const value = attributes[ key ];
			// Ignore undefined values.
			if ( undefined === value ) {
				return accumulator;
			}

			// Ignore all attributes but the ones with an "undefined" source
			// "undefined" source refers to attributes saved in the block comment.
			if ( attributeSchema.source !== undefined ) {
				return accumulator;
			}

			// Ignore default value.
			if (
				'default' in attributeSchema &&
				attributeSchema.default === value
			) {
				return accumulator;
			}

			// Otherwise, include in comment set.
			accumulator[ key ] = value;
			return accumulator;
		},
		{}
	);
}

/**
 * Given an attributes object, returns a string in the serialized attributes
 * format prepared for post content.
 *
 * @param {Object} attributes Attributes object.
 *
 * @return {string} Serialized attributes.
 */
export function serializeAttributes( attributes ) {
	return (
		JSON.stringify( attributes )
			// Don't break HTML comments.
			.replace( /--/g, '\\u002d\\u002d' )

			// Don't break non-standard-compliant tools.
			.replace( /</g, '\\u003c' )
			.replace( />/g, '\\u003e' )
			.replace( /&/g, '\\u0026' )

			// Bypass server stripslashes behavior which would unescape stringify's
			// escaping of quotation mark.
			//
			// See: https://developer.wordpress.org/reference/functions/wp_kses_stripslashes/
			.replace( /\\"/g, '\\u0022' )
	);
}

/**
 * Given a block object, returns the Block's Inner HTML markup.
 *
 * @param {Object} block Block instance.
 *
 * @return {string} HTML.
 */
export function getBlockInnerHTML( block ) {
	// If block was parsed as invalid or encounters an error while generating
	// save content, use original content instead to avoid content loss. If a
	// block contains nested content, exempt it from this condition because we
	// otherwise have no access to its original content and content loss would
	// still occur.
	let saveContent = block.originalContent;
	if ( block.isValid || block.innerBlocks.length ) {
		try {
			saveContent = getSaveContent(
				block.name,
				block.attributes,
				block.innerBlocks
			);
		} catch ( error ) {}
	}

	return saveContent;
}

/**
 * Returns the content of a block, including comment delimiters.
 *
 * @param {string} rawBlockName Block name.
 * @param {Object} attributes   Block attributes.
 * @param {string} content      Block save content.
 *
 * @return {string} Comment-delimited block content.
 */
export function getCommentDelimitedContent(
	rawBlockName,
	attributes,
	content
) {
	const serializedAttributes =
		attributes && Object.entries( attributes ).length
			? serializeAttributes( attributes ) + ' '
			: '';

	// Strip core blocks of their namespace prefix.
	const blockName = rawBlockName?.startsWith( 'core/' )
		? rawBlockName.slice( 5 )
		: rawBlockName;

	// @todo make the `wp:` prefix potentially configurable.

	if ( ! content ) {
		return `<!-- wp:${ blockName } ${ serializedAttributes }/-->`;
	}

	return (
		`<!-- wp:${ blockName } ${ serializedAttributes }-->\n` +
		content +
		`\n<!-- /wp:${ blockName } -->`
	);
}

/**
 * Returns the content of a block, including comment delimiters, determining
 * serialized attributes and content form from the current state of the block.
 *
 * @param {WPBlock}                     block   Block instance.
 * @param {WPBlockSerializationOptions} options Serialization options.
 *
 * @return {string} Serialized block.
 */
export function serializeBlock( block, { isInnerBlocks = false } = {} ) {
	if ( ! block.isValid && block.__unstableBlockSource ) {
		return serializeRawBlock( block.__unstableBlockSource );
	}

	const blockName = block.name;
	const saveContent = getBlockInnerHTML( block );

	if (
		blockName === getUnregisteredTypeHandlerName() ||
		( ! isInnerBlocks && blockName === getFreeformContentHandlerName() )
	) {
		return saveContent;
	}

	const blockType = getBlockType( blockName );
	if ( ! blockType ) {
		return saveContent;
	}

	const saveAttributes = getCommentAttributes( blockType, block.attributes );
	return getCommentDelimitedContent( blockName, saveAttributes, saveContent );
}

export function __unstableSerializeAndClean( blocks ) {
	// A single unmodified default block is assumed to
	// be equivalent to an empty post.
	if ( blocks.length === 1 && isUnmodifiedDefaultBlock( blocks[ 0 ] ) ) {
		blocks = [];
	}

	let content = serialize( blocks );

	// For compatibility, treat a post consisting of a
	// single freeform block as legacy content and apply
	// pre-block-editor removep'd content formatting.
	if (
		blocks.length === 1 &&
		blocks[ 0 ].name === getFreeformContentHandlerName()
	) {
		content = removep( content );
	}

	return content;
}

/**
 * Takes a block or set of blocks and returns the serialized post content.
 *
 * @param {Array}                       blocks  Block(s) to serialize.
 * @param {WPBlockSerializationOptions} options Serialization options.
 *
 * @return {string} The post content.
 */
export default function serialize( blocks, options ) {
	const blocksArray = Array.isArray( blocks ) ? blocks : [ blocks ];
	return blocksArray
		.map( ( block ) => serializeBlock( block, options ) )
		.join( '\n\n' );
}
