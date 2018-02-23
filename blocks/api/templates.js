/**
 * External dependencies
 */
import { every, map } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from './factory';

/**
 * Checks whether a list of blocks matches a template by comparing the block names.
 *
 * @param {Array} blocks    Block list.
 * @param {Array} template  Block template.
 *
 * @return {boolean}        Whether the list of blocks matches a templates
 */
export function doesBlocksMatchTemplate( blocks = [], template = [] ) {
	return (
		blocks.length === template.length &&
		every( template, ( [ name, , innerBlocksTemplate ], index ) => {
			const block = blocks[ index ];
			return (
				name === block.name &&
				doesBlocksMatchTemplate( block.innerBlocks, innerBlocksTemplate )
			);
		} )
	);
}

/**
 * Synchronize a block list with a block template.
 *
 * @param {Array} blocks    Block list.
 * @param {Array} template  Block template.
 *
 * @return {Array}          Updated Block list.
 */
export function synchronizeBlocksWithTemplate( blocks = [], template = [] ) {
	return map( template, ( [ name, attributes, innerBlocksTemplate ], index ) => {
		const block = blocks[ index ];

		if ( block && block.name === name ) {
			const innerBlocks = synchronizeBlocksWithTemplate( block.innerBlocks, innerBlocksTemplate );
			return { ...block, innerBlocks };
		}

		return createBlock(
			name,
			attributes,
			synchronizeBlocksWithTemplate( [], innerBlocksTemplate )
		);
	} );
}
