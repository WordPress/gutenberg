/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Creates a sessionStorage key for storing block selection.
 *
 * @param {string} postType Post type.
 * @param {number} postId   Post ID.
 * @return {string} SessionStorage key.
 */
function getSelectionStorageKey( postType, postId ) {
	return `wp-block-editor-selection-${ postType }-${ postId }`;
}

/**
 * Saves the current block selection to sessionStorage.
 * Stores both clientId (for fast restoration) and blockPath (for reliability).
 *
 * @param {string} postType Post type.
 * @param {number} postId   Post ID.
 * @param {string} clientId Selected block's clientId.
 * @param {Array}  path     Block path from useGenerateBlockPath.
 */
export function saveBlockSelection( postType, postId, clientId, path ) {
	if ( typeof window === 'undefined' || ! window.sessionStorage ) {
		return;
	}

	try {
		const data = {
			clientId,
			path,
			timestamp: Date.now(),
		};
		window.sessionStorage.setItem(
			getSelectionStorageKey( postType, postId ),
			JSON.stringify( data )
		);
	} catch ( error ) {
		// Silently fail if sessionStorage is full or unavailable
	}
}

/**
 * Retrieves and clears the stored block selection from sessionStorage.
 *
 * @param {string} postType Post type.
 * @param {number} postId   Post ID.
 * @return {Object|null} Stored selection data or null if not found.
 */
export function getAndClearBlockSelection( postType, postId ) {
	if ( typeof window === 'undefined' || ! window.sessionStorage ) {
		return null;
	}

	try {
		const key = getSelectionStorageKey( postType, postId );
		const stored = window.sessionStorage.getItem( key );

		if ( ! stored ) {
			return null;
		}

		// Clear immediately to prevent reuse
		window.sessionStorage.removeItem( key );

		const data = JSON.parse( stored );

		// Ignore stored selections older than 5 minutes
		const FIVE_MINUTES = 5 * 60 * 1000;
		if ( Date.now() - data.timestamp > FIVE_MINUTES ) {
			return null;
		}

		return data;
	} catch ( error ) {
		// Silently fail if parsing fails
		return null;
	}
}

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

/**
 * Hook that returns a function to restore a block selection from sessionStorage.
 * Attempts to use the stored clientId first (fast path), then falls back to
 * resolving the block path (reliable path).
 *
 * @return {Function} Function that takes postType and postId, returns the clientId or null.
 */
export function useRestoreBlockSelectionFromSession() {
	const registry = useRegistry();
	const restoreFromPath = useRestoreBlockFromPath();

	return useCallback(
		( postType, postId ) => {
			const stored = getAndClearBlockSelection( postType, postId );

			if ( ! stored ) {
				return null;
			}

			const { getBlock } = registry.select( blockEditorStore );

			// Fast path: Try the stored clientId first
			if ( stored.clientId && getBlock( stored.clientId ) ) {
				return stored.clientId;
			}

			// Fallback: Resolve using the block path
			if ( stored.path ) {
				return restoreFromPath( stored.path );
			}

			return null;
		},
		[ registry, restoreFromPath ]
	);
}
