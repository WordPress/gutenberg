/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { convertLegacyBlockNameAndAttributes } from './parser/convert-legacy-block';
import { createBlock } from './factory';
import { getBlockType } from './registration';

/**
 * Checks whether a list of blocks matches a template by comparing the block names.
 *
 * @param {Array} blocks   Block list.
 * @param {Array} template Block template.
 *
 * @return {boolean} Whether the list of blocks matches a templates.
 */
export function doBlocksMatchTemplate( blocks = [], template = [] ) {
	return (
		blocks.length === template.length &&
		template.every( ( [ name, , innerBlocksTemplate ], index ) => {
			const block = blocks[ index ];
			return (
				name === block.name &&
				doBlocksMatchTemplate( block.innerBlocks, innerBlocksTemplate )
			);
		} )
	);
}

const isHTMLAttribute = ( attributeDefinition ) =>
	attributeDefinition?.source === 'html';

const isQueryAttribute = ( attributeDefinition ) =>
	attributeDefinition?.source === 'query';

function normalizeAttributes( schema, values ) {
	if ( ! values ) {
		return {};
	}

	return Object.fromEntries(
		Object.entries( values ).map( ( [ key, value ] ) => [
			key,
			normalizeAttribute( schema[ key ], value ),
		] )
	);
}

function normalizeAttribute( definition, value ) {
	if ( isHTMLAttribute( definition ) && Array.isArray( value ) ) {
		// Introduce a deprecated call at this point
		// When we're confident that "children" format should be removed from the templates.

		return renderToString( value );
	}

	if ( isQueryAttribute( definition ) && value ) {
		return value.map( ( subValues ) => {
			return normalizeAttributes( definition.query, subValues );
		} );
	}

	return value;
}

/**
 * Synchronize a block list with a block template.
 *
 * Synchronizing a block list with a block template means that we loop over the blocks
 * keep the block as is if it matches the block at the same position in the template
 * (If it has the same name) and if doesn't match, we create a new block based on the template.
 * Extra blocks not present in the template are removed.
 *
 * @param {Array} blocks   Block list.
 * @param {Array} template Block template.
 *
 * @return {Array} Updated Block list.
 */
export function synchronizeBlocksWithTemplate( blocks = [], template ) {
	// If no template is provided, return blocks unmodified.
	if ( ! template ) {
		return blocks;
	}

	return template.map(
		( [ name, attributes, innerBlocksTemplate ], index ) => {
			const block = blocks[ index ];

			if ( block && block.name === name ) {
				const innerBlocks = synchronizeBlocksWithTemplate(
					block.innerBlocks,
					innerBlocksTemplate
				);
				return { ...block, innerBlocks };
			}

			// To support old templates that were using the "children" format
			// for the attributes using "html" strings now, we normalize the template attributes
			// before creating the blocks.

			const blockType = getBlockType( name );

			const normalizedAttributes = normalizeAttributes(
				blockType?.attributes ?? {},
				attributes
			);

			let [ blockName, blockAttributes ] =
				convertLegacyBlockNameAndAttributes(
					name,
					normalizedAttributes
				);

			// If a Block is undefined at this point, use the core/missing block as
			// a placeholder for a better user experience.
			if ( undefined === getBlockType( blockName ) ) {
				blockAttributes = {
					originalName: name,
					originalContent: '',
					originalUndelimitedContent: '',
				};
				blockName = 'core/missing';
			}

			return createBlock(
				blockName,
				blockAttributes,
				synchronizeBlocksWithTemplate( [], innerBlocksTemplate )
			);
		}
	);
}
