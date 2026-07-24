/**
 * External dependencies
 */
import type { ReactNode } from 'react';

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
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import { removep } from '@wordpress/autop';
import deprecated from '@wordpress/deprecated';

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
import type { Block, BlockType, BlockSerializationOptions } from '../types';

/**
 * Returns the block's default classname from its name.
 *
 * @param blockName The block name.
 *
 * @return The block's default class.
 */
export function getBlockDefaultClassName( blockName: string ): string {
	// Generated HTML classes for blocks follow the `wp-block-{name}` nomenclature.
	// Blocks provided by WordPress drop the prefixes 'core/' or 'core-' (historically used in 'core-embed/').
	const className =
		'wp-block-' + blockName.replace( /\//, '-' ).replace( /^core-/, '' );

	return applyFilters(
		'blocks.getBlockDefaultClassName',
		className,
		blockName
	) as string;
}

/**
 * Returns the block's default menu item classname from its name.
 *
 * @param blockName The block name.
 *
 * @return The block's default menu item class.
 */
export function getBlockMenuDefaultClassName( blockName: string ): string {
	// Generated HTML classes for blocks follow the `editor-block-list-item-{name}` nomenclature.
	// Blocks provided by WordPress drop the prefixes 'core/' or 'core-' (historically used in 'core-embed/').
	const className =
		'editor-block-list-item-' +
		blockName.replace( /\//, '-' ).replace( /^core-/, '' );

	return applyFilters(
		'blocks.getBlockMenuDefaultClassName',
		className,
		blockName
	) as string;
}

const blockPropsProvider: {
	blockType?: BlockType;
	attributes?: Record< string, unknown >;
} = {};
const innerBlocksPropsProvider: { innerBlocks?: Block[] | unknown } = {};

/**
 * Call within a save function to get the props for the block wrapper.
 *
 * @param props Optional. Props to pass to the element.
 */
export function getBlockProps(
	props: Record< string, unknown > = {}
): Record< string, unknown > {
	const { blockType, attributes } = blockPropsProvider;
	return ( getBlockProps as unknown as { skipFilters?: boolean } ).skipFilters
		? props
		: ( applyFilters(
				'blocks.getSaveContent.extraProps',
				{ ...props },
				blockType,
				attributes
		  ) as Record< string, unknown > );
}

/**
 * Call within a save function to get the props for the inner blocks wrapper.
 *
 * @param props Optional. Props to pass to the element.
 */
export function getInnerBlocksProps(
	props: Record< string, unknown > = {}
): Record< string, unknown > {
	const { innerBlocks } = innerBlocksPropsProvider;
	// Allow a different component to be passed to getSaveElement to handle
	// inner blocks, bypassing the default serialisation.
	if ( ! Array.isArray( innerBlocks ) ) {
		return { ...props, children: innerBlocks };
	}
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
 * @param blockTypeOrName Block type or name.
 * @param attributes      Block attributes.
 * @param innerBlocks     Nested blocks.
 *
 * @return Save element or raw HTML string.
 */
export function getSaveElement(
	blockTypeOrName: string | BlockType,
	attributes: Record< string, unknown >,
	innerBlocks: Block[] = []
): unknown {
	const blockType = normalizeBlockType( blockTypeOrName );

	if ( ! blockType?.save ) {
		return null;
	}

	let save = blockType.save as unknown as (
		props: Record< string, unknown >
	) => unknown;

	// Component classes are unsupported for save since serialization must
	// occur synchronously. For improved interoperability with higher-order
	// components which often return component class, emulate basic support.
	if ( save.prototype instanceof Component ) {
		const SaveClass = save as unknown as new (
			props: unknown
		) => Component;
		const instance = new SaveClass( { attributes } );
		save = instance.render.bind( instance );
	}

	blockPropsProvider.blockType = blockType;
	blockPropsProvider.attributes = attributes;
	innerBlocksPropsProvider.innerBlocks = innerBlocks;

	let element = save( {
		attributes,
		innerBlocks,
	} ) as React.ReactElement;

	if (
		element !== null &&
		typeof element === 'object' &&
		hasFilter( 'blocks.getSaveContent.extraProps' ) &&
		! ( ( blockType.apiVersion ?? 0 ) > 1 )
	) {
		/**
		 * Filters the props applied to the block save result element.
		 *
		 * @param props      Props applied to save element.
		 * @param blockType  Block type definition.
		 * @param attributes Block attributes.
		 */
		const props = applyFilters(
			'blocks.getSaveContent.extraProps',
			{ ...element.props },
			blockType,
			attributes
		);

		if ( ! isShallowEqual( props, element.props ) ) {
			element = cloneElement(
				element,
				props as Record< string, unknown >
			);
		}
	}

	/**
	 * Filters the save result of a block during serialization.
	 *
	 * @param element    Block save result.
	 * @param blockType  Block type definition.
	 * @param attributes Block attributes.
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
 * @param blockTypeOrName Block type or name.
 * @param attributes      Block attributes.
 * @param innerBlocks     Nested blocks.
 *
 * @return Save content.
 */
export function getSaveContent(
	blockTypeOrName: string | BlockType | undefined | null,
	attributes: Record< string, unknown >,
	innerBlocks?: Block[]
): string {
	const blockType = normalizeBlockType(
		blockTypeOrName as string | BlockType
	);

	if ( ! blockType ) {
		return '';
	}

	return renderToString(
		getSaveElement( blockType, attributes, innerBlocks ) as ReactNode
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
 * @param blockType  Block type.
 * @param attributes Attributes from in-memory block data.
 *
 * @return Subset of attributes for comment serialization.
 */
export function getCommentAttributes(
	blockType: BlockType,
	attributes: Record< string, unknown >
): Record< string, unknown > {
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

			// Ignore all local attributes
			if ( attributeSchema.role === 'local' ) {
				return accumulator;
			}

			if ( attributeSchema.__experimentalRole === 'local' ) {
				deprecated( '__experimentalRole attribute', {
					since: '6.7',
					version: '6.8',
					alternative: 'role attribute',
					hint: `Check the block.json of the ${ blockType?.name } block.`,
				} );
				return accumulator;
			}

			// Ignore default value.
			if (
				'default' in attributeSchema &&
				JSON.stringify( attributeSchema.default ) ===
					JSON.stringify( value )
			) {
				return accumulator;
			}

			// Otherwise, include in comment set.
			accumulator[ key ] = value;
			return accumulator;
		},
		{} as Record< string, unknown >
	);
}

/**
 * Given an attributes object, returns a string in the serialized attributes
 * format prepared for post content.
 *
 * @param attributes Attributes object.
 *
 * @return Serialized attributes.
 */
export function serializeAttributes(
	attributes: Record< string, unknown >
): string {
	return (
		JSON.stringify( attributes )
			// Replace escaped `\` characters with the unicode escape sequence.
			.replaceAll( '\\\\', '\\u005c' )

			// Don't break HTML comments.
			.replaceAll( '--', '\\u002d\\u002d' )

			// Don't break non-standard-compliant tools.
			.replaceAll( '<', '\\u003c' )
			.replaceAll( '>', '\\u003e' )
			.replaceAll( '&', '\\u0026' )

			// Replace escaped quotes (`\"`) to prevent problems with wp_kses_stripsplashes.
			// This simple replacement is safe because `\\` has already been replaced.
			// `\"` is not a JSON string quote like `"\\"`.
			.replaceAll( '\\"', '\\u0022' )
	);
}

/**
 * Given the static HTML fragments of the Custom HTML block and its inner
 * blocks, returns the block's inner HTML markup by interleaving the fragments
 * with the serialized inner blocks.
 *
 * @param innerContent Static HTML fragments, `null` marking inner block positions.
 * @param innerBlocks  Inner blocks.
 *
 * @return HTML.
 */
function serializeInnerContent(
	innerContent: Array< string | null >,
	innerBlocks: Block[]
): string {
	let childIndex = 0;
	const parts = innerContent.map( ( item ) => {
		if ( item !== null ) {
			return item;
		}
		const innerBlock = innerBlocks[ childIndex++ ];
		return innerBlock
			? serializeBlock( innerBlock, { isInnerBlocks: true } )
			: '';
	} );

	// Defensively append inner blocks without a matching placeholder so that
	// content is never lost when the two arrays fall out of sync.
	for ( ; childIndex < innerBlocks.length; childIndex++ ) {
		parts.push(
			serializeBlock( innerBlocks[ childIndex ], { isInnerBlocks: true } )
		);
	}

	return parts.join( '' ).trim();
}

/**
 * Given a block object, returns the Block's Inner HTML markup.
 *
 * @param block Block instance.
 *
 * @return HTML.
 */
export function getBlockInnerHTML( block: Block ): string {
	// The Custom HTML block serializes from its static HTML fragments rather
	// than from a `save` implementation.
	if ( block.innerContent && block.name === 'core/html' ) {
		return serializeInnerContent( block.innerContent, block.innerBlocks );
	}

	// If block was parsed as invalid or encounters an error while generating
	// save content, use original content instead to avoid content loss. If a
	// block contains nested content, exempt it from this condition because we
	// otherwise have no access to its original content and content loss would
	// still occur.
	let saveContent: string = block.originalContent ?? '';
	if ( block.isValid || block.innerBlocks.length ) {
		try {
			saveContent = getSaveContent(
				block.name,
				block.attributes,
				block.innerBlocks
			);
		} catch {}
	}

	return saveContent;
}

/**
 * Returns the content of a block, including comment delimiters.
 *
 * @param rawBlockName Block name.
 * @param attributes   Block attributes.
 * @param content      Block save content.
 *
 * @return Comment-delimited block content.
 */
export function getCommentDelimitedContent(
	rawBlockName: string | undefined,
	attributes: Record< string, unknown > | null,
	content: string
): string {
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
 * @param block                 Block instance.
 * @param options               Serialization options.
 *
 * @param options.isInnerBlocks
 * @return Serialized block.
 */
export function serializeBlock(
	block: Block,
	{ isInnerBlocks = false }: BlockSerializationOptions = {}
): string {
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

export const __unstableSerializeAndClean = ( () => {
	const cache = new WeakMap< Block[], string >();

	return ( blocks: Block[] ): string => {
		const cached = cache.get( blocks );
		if ( cached !== undefined ) {
			return cached;
		}

		let effectiveBlocks = blocks;

		// A single unmodified default block is assumed to
		// be equivalent to an empty post.
		if (
			effectiveBlocks.length === 1 &&
			isUnmodifiedDefaultBlock( effectiveBlocks[ 0 ] )
		) {
			effectiveBlocks = [];
		}

		let content = serialize( effectiveBlocks );

		// For compatibility, treat a post consisting of a
		// single freeform block as legacy content and apply
		// pre-block-editor removep'd content formatting.
		if (
			effectiveBlocks.length === 1 &&
			effectiveBlocks[ 0 ].name === getFreeformContentHandlerName() &&
			effectiveBlocks[ 0 ].name === 'core/freeform'
		) {
			content = removep( content );
		}

		cache.set( blocks, content );
		return content;
	};
} )();

/**
 * Takes a block or set of blocks and returns the serialized post content.
 *
 * @param blocks  Block(s) to serialize.
 * @param options Serialization options.
 *
 * @return The post content.
 */
export default function serialize(
	blocks: Block | Block[],
	options?: BlockSerializationOptions
): string {
	const blocksArray = Array.isArray( blocks ) ? blocks : [ blocks ];
	return blocksArray
		.map( ( block ) => serializeBlock( block, options ) )
		.join( '\n\n' );
}
