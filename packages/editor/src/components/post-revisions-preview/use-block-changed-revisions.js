/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { diffRevisionContent } from './block-diff';
import { preserveClientIds } from './preserve-client-ids';

/**
 * Recursively collects clientIds of every block tagged with a
 * `__revisionDiffStatus` (added/removed/modified) into `into`.
 *
 * @param {Array} tree Diffed block tree.
 * @param {Set}   into Set to add changed clientIds into.
 */
export function collectChangedClientIds( tree, into ) {
	for ( const block of tree ) {
		if ( block.__revisionDiffStatus?.status ) {
			into.add( block.clientId );
		}
		if ( block.innerBlocks?.length ) {
			collectChangedClientIds( block.innerBlocks, into );
		}
	}
}

/**
 * Strips blocks tagged `removed` from a diffed tree so they aren't
 * mistaken for real content in subsequent revision steps.
 *
 * @param {Array} tree Diffed block tree.
 * @return {Array} Tree with `removed` blocks dropped.
 */
export function stripRemoved( tree ) {
	return tree
		.filter( ( block ) => block.__revisionDiffStatus?.status !== 'removed' )
		.map( ( block ) =>
			block.innerBlocks?.length
				? { ...block, innerBlocks: stripRemoved( block.innerBlocks ) }
				: block
		);
}
