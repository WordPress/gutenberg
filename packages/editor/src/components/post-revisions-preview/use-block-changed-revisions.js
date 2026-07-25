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

/**
 * Builds one entry per revision (oldest-first) where every entry's block tree
 * shares consistent clientIds across the chain, using the same two primitives
 * the rest of the revisions UI already relies on:
 * - `diffRevisionContent()` — the LCS + similarity-based diff.
 * - `preserveClientIds()` — clientId threading used by `useRevisionBlocks`.
 *
 * @param {Array} revisions Oldest-first revisions, each with `content.raw`.
 * @return {Array} `{ tree, changedClientIds }` entry per revision.
 */
export function buildRevisionChain( revisions ) {
	const chain = [];
	let previousTree = null;

	for ( let i = 0; i < revisions.length; i++ ) {
		const content = revisions[ i ]?.content?.raw ?? '';
		const changedClientIds = new Set();
		let tree;

		if ( i === 0 || ! previousTree ) {
			tree = parse( content );
		} else {
			const previousContent = revisions[ i - 1 ]?.content?.raw ?? '';
			const diffed = diffRevisionContent( content, previousContent );
			const threaded = preserveClientIds( diffed, previousTree );
			collectChangedClientIds( threaded, changedClientIds );
			tree = stripRemoved( threaded );
		}

		chain.push( { tree, changedClientIds } );
		previousTree = tree;
	}

	return chain;
}

/**
 * Translates a clientId from the live block-editor tree into the revision
 * chain's clientId space so it can be looked up in each chain entry's
 * `changedClientIds`. Uses `preserveClientIds()` to map `liveTree` against
 * `chainTree`, then walks both trees in lockstep to find the translation.
 *
 * @param {Array}  liveTree       Live block-editor tree (`getBlocks()`).
 * @param {Array}  chainTree      Chain tree at the displayed revision.
 * @param {string} targetClientId The selected block's live clientId.
 * @return {string|null} The corresponding chain clientId, or null.
 */
export function translateToChainClientId(
	liveTree,
	chainTree,
	targetClientId
) {
	const remapped = preserveClientIds( liveTree, chainTree );

	function search( liveNodes, remappedNodes ) {
		for ( let i = 0; i < liveNodes.length; i++ ) {
			if ( liveNodes[ i ].clientId === targetClientId ) {
				return remappedNodes[ i ]?.clientId ?? null;
			}
			if ( liveNodes[ i ].innerBlocks?.length ) {
				const found = search(
					liveNodes[ i ].innerBlocks,
					remappedNodes[ i ]?.innerBlocks || []
				);
				if ( found ) {
					return found;
				}
			}
		}
		return null;
	}

	return search( liveTree, remapped );
}

/**
 * Returns the set of revision indices (0-based, into the oldest-first
 * `revisions` array) where the currently selected block changed.
 *
 * The chain (one diff per adjacent revision pair) is only rebuilt when
 * `revisions` changes — not on every block selection. Selecting a different
 * block only re-runs a cheap clientId translation and Set lookups.
 *
 * @param {Array|null} revisions      Oldest-first revisions, each with `content.raw`.
 * @param {number}     displayedIndex Index of the revision currently shown.
 * @return {Set<number>} 0-based indices into `revisions` where the selected block changed.
 */
export function useBlockChangedRevisions( revisions, displayedIndex ) {
	const { blocks, selectedBlockClientId } = useSelect( ( select ) => {
		const { getBlocks, getSelectedBlockClientId } =
			select( blockEditorStore );
		return {
			blocks: getBlocks(),
			selectedBlockClientId: getSelectedBlockClientId(),
		};
	}, [] );

	const chain = useMemo(
		() => ( revisions?.length ? buildRevisionChain( revisions ) : [] ),
		[ revisions ]
	);

	return useMemo( () => {
		const changedIndices = new Set();

		if (
			! selectedBlockClientId ||
			! blocks?.length ||
			displayedIndex === null ||
			displayedIndex === undefined ||
			displayedIndex < 0 ||
			! chain[ displayedIndex ]
		) {
			return changedIndices;
		}

		const chainClientId = translateToChainClientId(
			blocks,
			chain[ displayedIndex ].tree,
			selectedBlockClientId
		);

		if ( ! chainClientId ) {
			return changedIndices;
		}

		chain.forEach( ( entry, index ) => {
			if ( entry.changedClientIds.has( chainClientId ) ) {
				changedIndices.add( index );
			}
		} );

		return changedIndices;
	}, [ chain, selectedBlockClientId, blocks, displayedIndex ] );
}
