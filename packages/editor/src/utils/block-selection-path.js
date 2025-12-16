/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Hook that returns a function to generate a block path for a given block clientId.
 * The path is an array of steps from root to the target block,
 * where each step contains the block name and index within its parent.
 *
 * @return {Function} Function that takes a clientId and returns the block path or null.
 */
export function useGenerateBlockPath() {
	const registry = useRegistry();

	return useCallback(
		( clientId ) => {
			const { getBlock, getBlockParents, getBlockOrder } =
				registry.select( blockEditorStore );

			const block = getBlock( clientId );
			if ( ! block ) {
				return null;
			}

			const parents = getBlockParents( clientId );
			const path = [];

			// Build the path from root to target
			const hierarchy = [ ...parents, clientId ];

			for ( let i = 0; i < hierarchy.length; i++ ) {
				const currentClientId = hierarchy[ i ];
				const currentBlock = getBlock( currentClientId );

				if ( ! currentBlock ) {
					return null;
				}

				// Get the parent's clientId (or null for root-level blocks)
				const parentClientId = i > 0 ? hierarchy[ i - 1 ] : '';

				// Get siblings to determine index
				const siblings = getBlockOrder( parentClientId );
				const index = siblings.indexOf( currentClientId );

				if ( index === -1 ) {
					return null;
				}

				path.push( {
					blockName: currentBlock.name,
					index,
					// Store a simple content hash for verification (first 100 chars of serialized content)
					contentHash: JSON.stringify(
						currentBlock.attributes
					).slice( 0, 100 ),
				} );
			}

			return path;
		},
		[ registry ]
	);
}

/**
 * Hook that returns a function to restore a block selection using a previously generated block path.
 * Walks the path from root to target, matching block name and index at each level.
 *
 * @return {Function} Function that takes a path and returns the clientId or null.
 */
export function useRestoreBlockFromPath() {
	const registry = useRegistry();

	return useCallback(
		( path ) => {
			if ( ! path || ! Array.isArray( path ) || path.length === 0 ) {
				return null;
			}

			const { getBlock, getBlockOrder } =
				registry.select( blockEditorStore );

			let currentParentId = ''; // Start at root

			// Walk through each step in the path
			for ( let i = 0; i < path.length; i++ ) {
				const step = path[ i ];
				const siblings = getBlockOrder( currentParentId );

				// Check if the index is valid
				if ( step.index >= siblings.length ) {
					return null;
				}

				const candidateClientId = siblings[ step.index ];
				const candidateBlock = getBlock( candidateClientId );

				if ( ! candidateBlock ) {
					return null;
				}

				// Verify the block name matches
				if ( candidateBlock.name !== step.blockName ) {
					return null;
				}

				// Optional: verify content hash for additional confidence
				// (Skipping this for now as attributes might change slightly)

				// If this is the last step, we found our block
				if ( i === path.length - 1 ) {
					return candidateClientId;
				}

				// Otherwise, continue to the next level
				currentParentId = candidateClientId;
			}

			return null;
		},
		[ registry ]
	);
}
