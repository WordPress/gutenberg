/**
 * External dependencies
 */
import { get, every, map, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { create } from '@wordpress/rich-text';
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createBlock } from './factory';
import { getBlockType } from './registration';

/**
 * Checks whether a list of blocks matches a template by comparing the block names.
 *
 * @param {Array} blocks    Block list.
 * @param {Array} template  Block template.
 *
 * @return {boolean}        Whether the list of blocks matches a templates
 */
export function doBlocksMatchTemplate( blocks = [], template = [] ) {
	return (
		blocks.length === template.length &&
		every( template, ( [ name, , innerBlocksTemplate ], index ) => {
			const block = blocks[ index ];
			return (
				name === block.name &&
				doBlocksMatchTemplate( block.innerBlocks, innerBlocksTemplate )
			);
		} )
	);
}

/**
 * Synchronize a block list with a block template.
 *
 * Synchronizing a block list with a block template means that we loop over the blocks
 * keep the block as is if it matches the block at the same position in the template
 * (If it has the same name) and if doesn't match, we create a new block based on the template.
 * Extra blocks not present in the template are removed.
 *
 * @param {Array} blocks    Block list.
 * @param {Array} template  Block template.
 *
 * @return {Array}          Updated Block list.
 */
export function synchronizeBlocksWithTemplate( blocks = [], template ) {
	// If no template is provided, return blocks unmodified.
	if ( ! template ) {
		return blocks;
	}

	return map( template, ( [ name, attributes, innerBlocksTemplate ], index ) => {
		const block = blocks[ index ];

		if ( block && block.name === name ) {
			const innerBlocks = synchronizeBlocksWithTemplate( block.innerBlocks, innerBlocksTemplate );
			return { ...block, innerBlocks };
		}

		// The template attributes format is a bit different than the block's attributes format
		// Because we don't want to expose the `rich-text` type in templates format
		// Instead, we use the "element" format which is less verbose.
		const blockType = getBlockType( name );
		const isRichTextAttribute = ( attributeDefinition ) => get( attributeDefinition, [ 'source' ] ) === 'rich-text';
		const isQueryAttribute = ( attributeDefinition ) => get( attributeDefinition, [ 'source' ] ) === 'query';

		const normalizeAttributes = ( schema, values ) => {
			return mapValues( values, ( value, key ) => {
				return normalizeAttribute( schema[ key ], value );
			} );
		};
		const normalizeAttribute = ( definition, value ) => {
			if ( isRichTextAttribute( definition ) ) {
				return create( { html: renderToString( value ) } );
			}

			if ( isQueryAttribute( definition ) && value ) {
				return value.map( ( subValues ) => {
					return normalizeAttributes( definition.query, subValues );
				} );
			}

			return value;
		};

		const normalizedAttributes = normalizeAttributes(
			get( blockType, [ 'attributes' ], {} ),
			attributes
		);

		return createBlock(
			name,
			normalizedAttributes,
			synchronizeBlocksWithTemplate( [], innerBlocksTemplate )
		);
	} );
}
