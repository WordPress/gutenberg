/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useInstanceId,
	useMergeRefs,
	__experimentalUseFixedWindowList as useFixedWindowList,
} from '@wordpress/compose';
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import {
	useCallback,
	useMemo,
	useRef,
	useReducer,
	forwardRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ListViewBranch from './branch';
import {
	ListViewContext,
	ListViewInsertedBlockContext,
	ListViewTreeStateContext,
} from './context';
import ListViewDropIndicatorPreview from './drop-indicator';
import useBlockSelection from './use-block-selection';
import useListViewBlockIndexes from './use-list-view-block-indexes';
import useListViewClientIds from './use-list-view-client-ids';
import useListViewCollapseItems from './use-list-view-collapse-items';
import useListViewDropZone from './use-list-view-drop-zone';
import useListViewExpandSelectedItem from './use-list-view-expand-selected-item';
import { store as blockEditorStore } from '../../store';
import { BlockSettingsDropdown } from '../block-settings-menu/block-settings-dropdown';
import { BLOCK_LIST_ITEM_HEIGHT, focusListItem } from './utils';
import useClipboardHandler from './use-clipboard-handler';

const expansion = ( state, action ) => {
	const { type, clientIds } = action;

	// Overwrite the state: only the listed blocks stay expanded, every other
	// block falls back to the list view's default.
	if ( type === 'replace' ) {
		const next = Object.fromEntries(
			clientIds.map( ( id ) => [ id, true ] )
		);
		return isShallowEqual( state, next ) ? state : next;
	}

	if ( type !== 'expand' && type !== 'collapse' ) {
		return state;
	}

	const isExpand = type === 'expand';
	// An unrecorded block is not the same as an explicitly collapsed one,
	// because the fallback depends on the `isExpanded` prop.
	const changed = clientIds.filter( ( id ) => state[ id ] !== isExpand );

	if ( ! changed.length ) {
		return state;
	}

	return {
		...state,
		...Object.fromEntries( changed.map( ( id ) => [ id, isExpand ] ) ),
	};
};

/** @typedef {React.ComponentType} ComponentType */
/** @typedef {React.Ref<HTMLElement>} Ref */

/**
 * Show a hierarchical list of blocks.
 *
 * @param {Object}         props                        Components props.
 * @param {string}         props.id                     An HTML element id for the root element of ListView.
 * @param {Array}          props.blocks                 _deprecated_ Custom subset of block client IDs to be used instead of the default hierarchy.
 * @param {?HTMLElement}   props.dropZoneElement        Optional element to be used as the drop zone.
 * @param {?boolean}       props.showBlockMovers        Flag to enable block movers. Defaults to `false`.
 * @param {?boolean}       props.isExpanded             Flag to determine whether nested levels are expanded by default. Defaults to `false`.
 * @param {?boolean}       props.showAppender           Flag to show or hide the block appender. Defaults to `false`.
 * @param {?ComponentType} props.blockSettingsMenu      Optional more menu substitution. Defaults to the standard `BlockSettingsDropdown` component.
 * @param {string}         props.rootClientId           The client id of the root block from which we determine the blocks to show in the list.
 * @param {string}         props.description            Optional accessible description for the tree grid component.
 * @param {?Function}      props.onSelect               Optional callback to be invoked when a block is selected. Receives the block object that was selected.
 * @param {?ComponentType} props.additionalBlockContent Component that renders additional block content UI.
 * @param {Ref}            ref                          Forwarded ref
 */
function ListViewComponent(
	{
		id,
		blocks,
		dropZoneElement,
		showBlockMovers = false,
		isExpanded = false,
		showAppender = false,
		blockSettingsMenu: BlockSettingsMenu = BlockSettingsDropdown,
		rootClientId,
		description,
		onSelect,
		additionalBlockContent: AdditionalBlockContent,
	},
	ref
) {
	// This can be removed once we no longer need to support the blocks prop.
	if ( blocks ) {
		deprecated(
			'`blocks` property in `wp.blockEditor.__experimentalListView`',
			{
				since: '6.3',
				alternative: '`rootClientId` property',
			}
		);
	}

	const instanceId = useInstanceId( ListViewComponent );
	const { clientIdsTree, draggedClientIds, selectedClientIds } =
		useListViewClientIds( { blocks, rootClientId } );
	const blockIndexes = useListViewBlockIndexes( clientIdsTree );

	const { getBlock, getSelectedBlockClientIds } =
		useSelect( blockEditorStore );
	const { visibleBlockCount } = useSelect(
		( select ) => {
			const { getGlobalBlockCount, getClientIdsOfDescendants } =
				select( blockEditorStore );
			const draggedBlockCount =
				draggedClientIds?.length > 0
					? getClientIdsOfDescendants( draggedClientIds ).length + 1
					: 0;
			return {
				visibleBlockCount: getGlobalBlockCount() - draggedBlockCount,
			};
		},
		[ draggedClientIds ]
	);

	const { updateBlockSelection } = useBlockSelection();

	const [ expansionState, updateExpansion ] = useReducer( expansion, {} );

	const [ insertedBlockClientId, setInsertedBlockClientId ] =
		useState( null );

	const { setSelectedTreeId } = useListViewExpandSelectedItem( {
		firstSelectedBlockClientId: selectedClientIds[ 0 ],
		updateExpansion,
	} );
	const selectEditorBlock = useCallback(
		/**
		 * @param {MouseEvent | KeyboardEvent | undefined} event
		 * @param {string}                                 blockClientId
		 * @param {null | undefined | -1 | 1}              focusPosition
		 */
		( event, blockClientId, focusPosition ) => {
			updateBlockSelection( event, blockClientId, null, focusPosition );
			setSelectedTreeId( blockClientId );
			if ( onSelect ) {
				onSelect( getBlock( blockClientId ) );
			}
		},
		[ setSelectedTreeId, updateBlockSelection, onSelect, getBlock ]
	);

	const { ref: dropZoneRef, target: blockDropTarget } = useListViewDropZone( {
		dropZoneElement,
		updateExpansion,
	} );
	const elementRef = useRef();

	// Allow handling of copy, cut, and paste events.
	const clipBoardRef = useClipboardHandler( {
		selectBlock: selectEditorBlock,
	} );

	const focusSelectedBlock = useCallback(
		( node ) => {
			const [ firstSelectedClientId ] = getSelectedBlockClientIds();
			// If a blocks are already selected when the list view is initially
			// mounted, shift focus to the first selected block.
			if ( firstSelectedClientId && node ) {
				focusListItem( firstSelectedClientId, node );
			}
		},
		[ getSelectedBlockClientIds ]
	);

	const treeGridRef = useMergeRefs( [
		clipBoardRef,
		focusSelectedBlock,
		elementRef,
		dropZoneRef,
		ref,
	] );

	const expandRow = useCallback( ( row ) => {
		const clientId = row?.dataset?.block;
		if ( clientId ) {
			updateExpansion( { type: 'expand', clientIds: [ clientId ] } );
		}
	}, [] );
	const collapseRow = useCallback( ( row ) => {
		const clientId = row?.dataset?.block;
		if ( clientId ) {
			updateExpansion( { type: 'collapse', clientIds: [ clientId ] } );
		}
	}, [] );
	const focusRow = useCallback(
		( event, startRow, endRow ) => {
			if ( event.shiftKey ) {
				updateBlockSelection(
					event,
					startRow?.dataset?.block,
					endRow?.dataset?.block
				);
			}
		},
		[ updateBlockSelection ]
	);

	useListViewCollapseItems( { updateExpansion } );

	const firstDraggedBlockClientId = draggedClientIds?.[ 0 ];

	// Convert a blockDropTarget into indexes relative to the blocks in the list view.
	// These values are used to determine which blocks should be displaced to make room
	// for the drop indicator. See `ListViewBranch` and `getDragDisplacementValues`.
	const { blockDropTargetIndex, blockDropPosition, firstDraggedBlockIndex } =
		useMemo( () => {
			let _blockDropTargetIndex, _firstDraggedBlockIndex;

			if ( blockDropTarget?.clientId ) {
				const foundBlockIndex =
					blockIndexes[ blockDropTarget.clientId ];
				// If dragging below or inside the block, treat the drop target as the next block.
				_blockDropTargetIndex =
					foundBlockIndex === undefined ||
					blockDropTarget?.dropPosition === 'top'
						? foundBlockIndex
						: foundBlockIndex + 1;
			} else if ( blockDropTarget === null ) {
				// A `null` value is used to indicate that the user is dragging outside of the list view.
				_blockDropTargetIndex = null;
			}

			if ( firstDraggedBlockClientId ) {
				const foundBlockIndex =
					blockIndexes[ firstDraggedBlockClientId ];
				_firstDraggedBlockIndex =
					foundBlockIndex === undefined ||
					blockDropTarget?.dropPosition === 'top'
						? foundBlockIndex
						: foundBlockIndex + 1;
			}

			return {
				blockDropTargetIndex: _blockDropTargetIndex,
				blockDropPosition: blockDropTarget?.dropPosition,
				firstDraggedBlockIndex: _firstDraggedBlockIndex,
			};
		}, [ blockDropTarget, blockIndexes, firstDraggedBlockClientId ] );

	// Values that stay stable for the lifetime of the List View.
	const contextValue = useMemo(
		() => ( {
			AdditionalBlockContent,
			BlockSettingsMenu,
			listViewInstanceId: instanceId,
			rootClientId,
			setInsertedBlockClientId,
			treeGridElementRef: elementRef,
			updateExpansion,
		} ),
		[
			AdditionalBlockContent,
			BlockSettingsMenu,
			instanceId,
			rootClientId,
			setInsertedBlockClientId,
			updateExpansion,
		]
	);

	// Values that change while expanding, collapsing, or dragging.
	const treeStateContextValue = useMemo(
		() => ( {
			blockDropPosition,
			blockDropTargetIndex,
			blockIndexes,
			draggedClientIds,
			expansionState,
			firstDraggedBlockIndex,
		} ),
		[
			blockDropPosition,
			blockDropTargetIndex,
			blockIndexes,
			draggedClientIds,
			expansionState,
			firstDraggedBlockIndex,
		]
	);

	const [ fixedListWindow ] = useFixedWindowList(
		elementRef,
		BLOCK_LIST_ITEM_HEIGHT,
		visibleBlockCount,
		{
			// Ensure that the windowing logic is recalculated when the expanded state changes.
			// This is necessary because expanding a collapsed block in a short list view can
			// switch the list view to a tall list view with a scrollbar, and vice versa.
			// When this happens, the windowing logic needs to be recalculated to ensure that
			// the correct number of blocks are rendered, by rechecking for a scroll container.
			expandedState: expansionState,
			useWindowing: true,
			windowOverscan: 40,
		}
	);

	// If there are no blocks to show and we're not showing the appender, do not render the list view.
	if ( ! clientIdsTree.length && ! showAppender ) {
		return null;
	}

	const describedById =
		description && `block-editor-list-view-description-${ instanceId }`;

	return (
		<AsyncModeProvider value>
			<ListViewDropIndicatorPreview
				draggedBlockClientId={ firstDraggedBlockClientId }
				listViewRef={ elementRef }
				blockDropTarget={ blockDropTarget }
			/>
			{ description && (
				<VisuallyHidden id={ describedById }>
					{ description }
				</VisuallyHidden>
			) }
			<TreeGrid
				id={ id }
				className={ clsx( 'block-editor-list-view-tree', {
					'is-dragging':
						draggedClientIds?.length > 0 &&
						blockDropTargetIndex !== undefined,
				} ) }
				aria-label={ __( 'Block navigation structure' ) }
				ref={ treeGridRef }
				onCollapseRow={ collapseRow }
				onExpandRow={ expandRow }
				onFocusRow={ focusRow }
				applicationAriaLabel={ __( 'Block navigation structure' ) }
				aria-describedby={ describedById }
				style={ {
					'--wp-admin--list-view-dragged-items-height':
						draggedClientIds?.length
							? `${
									BLOCK_LIST_ITEM_HEIGHT *
									( draggedClientIds.length - 1 )
							  }px`
							: null,
				} }
			>
				<ListViewContext.Provider value={ contextValue }>
					<ListViewInsertedBlockContext.Provider
						value={ insertedBlockClientId }
					>
						<ListViewTreeStateContext.Provider
							value={ treeStateContextValue }
						>
							<ListViewBranch
								blocks={ clientIdsTree }
								parentId={ rootClientId }
								selectBlock={ selectEditorBlock }
								showBlockMovers={ showBlockMovers }
								fixedListWindow={ fixedListWindow }
								selectedClientIds={ selectedClientIds }
								isExpanded={ isExpanded }
								showAppender={ showAppender }
							/>
						</ListViewTreeStateContext.Provider>
					</ListViewInsertedBlockContext.Provider>
				</ListViewContext.Provider>
			</TreeGrid>
		</AsyncModeProvider>
	);
}

// This is the private API for the ListView component.
// It allows access to all props, not just the public ones.
export const PrivateListView = forwardRef( ListViewComponent );

// This is the public API for the ListView component.
// We wrap the PrivateListView component to hide some props from the public API.
export default forwardRef( ( props, ref ) => {
	return (
		<PrivateListView
			ref={ ref }
			{ ...props }
			showAppender={ false }
			rootClientId={ null }
			onSelect={ null }
			additionalBlockContent={ null }
			blockSettingsMenu={ undefined }
		/>
	);
} );
