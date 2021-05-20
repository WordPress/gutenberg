/**
 * WordPress dependencies
 */

import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationBranch from './branch';
import { BlockNavigationContext } from './context';
import useBlockNavigationClientIds from './use-block-navigation-client-ids';
import useBlockNavigationDropZone from './use-block-navigation-drop-zone';
import { store as blockEditorStore } from '../../store';

const noop = () => {};

/**
 * Wrap `BlockNavigationRows` with `TreeGrid`. BlockNavigationRows is a
 * recursive component (it renders itself), so this ensures TreeGrid is only
 * present at the very top of the navigation grid.
 *
 * @param {Object}   props                                          Components props.
 * @param {Array}    props.blocks                                   Custom subset of block client IDs to be used instead of the default hierarchy.
 * @param {Function} props.onSelect                                 Block selection callback.
 * @param {boolean}  props.showNestedBlocks                         Flag to enable displaying nested blocks.
 * @param {boolean}  props.showOnlyCurrentHierarchy                 Flag to limit the list to the current hierarchy of blocks.
 * @param {boolean}  props.__experimentalFeatures                   Flag to enable experimental features.
 * @param {boolean}  props.__experimentalPersistentListViewFeatures Flag to enable features for the Persistent List View experiment.
 */
export default function BlockNavigationTree( {
	blocks,
	showOnlyCurrentHierarchy,
	onSelect = noop,
	__experimentalFeatures,
	__experimentalPersistentListViewFeatures,
	...props
} ) {
	const { clientIdsTree, selectedClientIds } = useBlockNavigationClientIds(
		blocks,
		showOnlyCurrentHierarchy,
		__experimentalPersistentListViewFeatures
	);
	const { selectBlock } = useDispatch( blockEditorStore );
	const selectEditorBlock = useCallback(
		( clientId ) => {
			selectBlock( clientId );
			onSelect( clientId );
		},
		[ selectBlock, onSelect ]
	);

	let {
		ref: treeGridRef,
		target: blockDropTarget,
	} = useBlockNavigationDropZone();

	const isMounted = useRef( false );
	useEffect( () => {
		isMounted.current = true;
	}, [] );

	if ( ! __experimentalFeatures ) {
		blockDropTarget = undefined;
	}

	const contextValue = useMemo(
		() => ( {
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			blockDropTarget,
			isTreeGridMounted: isMounted.current,
		} ),
		[
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			blockDropTarget,
			isMounted.current,
		]
	);

	return (
		<TreeGrid
			className="block-editor-block-navigation-tree"
			aria-label={ __( 'Block navigation structure' ) }
			ref={ treeGridRef }
		>
			<BlockNavigationContext.Provider value={ contextValue }>
				<BlockNavigationBranch
					blocks={ clientIdsTree }
					selectBlock={ selectEditorBlock }
					selectedBlockClientIds={ selectedClientIds }
					{ ...props }
				/>
			</BlockNavigationContext.Provider>
		</TreeGrid>
	);
}
