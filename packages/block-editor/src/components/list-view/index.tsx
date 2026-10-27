import type { CSSProperties, ForwardedRef, KeyboardEvent } from 'react';
import clsx from 'clsx';
import {
	useInstanceId,
	useMergeRefs,
	useRefEffect,
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
import { ListViewContentPopover } from '../inspector-controls/list-view-content-popover';
import type {
	ListViewExpansionAction,
	ListViewExpansionState,
	ListViewProps,
	ListViewSelectBlock,
	PrivateListViewProps,
} from './types';

const expansion = (
	state: ListViewExpansionState,
	action: ListViewExpansionAction
): ListViewExpansionState => {
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

/**
 * Show a hierarchical list of blocks.
 *
 * @param props                        Components props.
 * @param props.id                     An HTML element id for the root element of ListView.
 * @param props.blocks                 _deprecated_ Custom subset of block client IDs to be used instead of the default hierarchy.
 * @param props.dropZoneElement        Optional element to be used as the drop zone.
 * @param props.showBlockMovers        Flag to enable block movers. Defaults to `false`.
 * @param props.isExpanded             Flag to determine whether nested levels are expanded by default. Defaults to `false`.
 * @param props.showAppender           Flag to show or hide the block appender. Defaults to `false`.
 * @param props.focusOnMount           Flag to move focus into the list when it mounts. Defaults to `false`.
 * @param props.blockSettingsMenu      Optional more menu substitution. Defaults to the standard `BlockSettingsDropdown` component.
 * @param props.rootClientId           The client id of the root block from which we determine the blocks to show in the list.
 * @param props.description            Optional accessible description for the tree grid component.
 * @param props.onSelect               Optional callback to be invoked when a block is selected. Receives the block object that was selected.
 * @param props.additionalBlockContent Component that renders additional block content UI.
 * @param props.showContentPopover     Flag to render the selected block's content controls in a popover anchored to its row. Defaults to `false`.
 * @param ref                          Forwarded ref
 */
function ListViewComponent(
	{
		id,
		blocks,
		dropZoneElement,
		showBlockMovers = false,
		isExpanded = false,
		showAppender = false,
		focusOnMount = false,
		blockSettingsMenu: BlockSettingsMenu = BlockSettingsDropdown,
		rootClientId,
		description,
		onSelect,
		additionalBlockContent: AdditionalBlockContent,
		showContentPopover = false,
	}: PrivateListViewProps,
	ref: ForwardedRef< HTMLElement >
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

	const [ insertedBlockClientId, setInsertedBlockClientId ] = useState<
		string | null
	>( null );

	const { setSelectedTreeId } = useListViewExpandSelectedItem( {
		firstSelectedBlockClientId: selectedClientIds[ 0 ],
		updateExpansion,
	} );
	const selectEditorBlock: ListViewSelectBlock = useCallback(
		( event, blockClientId, focusPosition ) => {
			// Deselecting passes no client ID, which the store ignores.
			updateBlockSelection(
				event,
				blockClientId as string,
				null,
				focusPosition
			);
			setSelectedTreeId( blockClientId );
			if ( onSelect ) {
				// `getBlock` returns `null` without a client ID.
				onSelect( getBlock( blockClientId as string ) );
			}
		},
		[ setSelectedTreeId, updateBlockSelection, onSelect, getBlock ]
	);

	const { ref: dropZoneRef, target: blockDropTarget } = useListViewDropZone( {
		dropZoneElement,
		updateExpansion,
	} );
	const elementRef = useRef< HTMLElement >( null );

	// Allow handling of copy, cut, and paste events.
	const clipBoardRef = useClipboardHandler( {
		selectBlock: selectEditorBlock,
	} );

	const focusOnMountRef = useRefEffect(
		( node: HTMLElement ) => {
			// A list that mounts as a side effect of selecting a block, the
			// block inspector's for one, would pull focus out of whatever the
			// user is editing, so taking focus is opt-in.
			if ( ! focusOnMount ) {
				return;
			}

			const controller = new window.AbortController();
			const focusRow = ( clientId: string ) =>
				// A promise is returned for an existing element.
				focusListItem( clientId, node, controller.signal )!.then( () =>
					controller.abort()
				);

			// Anything that takes focus first has a better claim to it. The row
			// is not always there yet either, because a nested block waits on
			// its ancestors expanding.
			node.ownerDocument.addEventListener(
				'focusin',
				() => controller.abort(),
				{ once: true, signal: controller.signal }
			);

			const [ firstSelectedClientId ] = getSelectedBlockClientIds();

			if ( firstSelectedClientId ) {
				focusRow( firstSelectedClientId );
				return () => controller.abort();
			}

			// With nothing selected the top of the list gets focus, but only
			// once the click that opened the list is over. Focusing a row costs
			// a style and layout pass, and inside that commit it lands on a
			// document that is still dirty.
			const timerId = setTimeout( () => {
				const firstClientId = node.querySelector< HTMLElement >(
					'[role=row][data-block]'
				)?.dataset.block;
				if ( firstClientId ) {
					focusRow( firstClientId );
				}
			}, 0 );

			return () => {
				clearTimeout( timerId );
				controller.abort();
			};
		},
		[ focusOnMount, getSelectedBlockClientIds ]
	);

	const treeGridRef = useMergeRefs( [
		clipBoardRef,
		focusOnMountRef,
		elementRef,
		dropZoneRef,
		ref,
	] );

	const expandRow = useCallback( ( row: HTMLElement ) => {
		const clientId = row?.dataset?.block;
		if ( clientId ) {
			updateExpansion( { type: 'expand', clientIds: [ clientId ] } );
		}
	}, [] );
	const collapseRow = useCallback( ( row: HTMLElement ) => {
		const clientId = row?.dataset?.block;
		if ( clientId ) {
			updateExpansion( { type: 'collapse', clientIds: [ clientId ] } );
		}
	}, [] );
	const focusRow = useCallback(
		(
			event: KeyboardEvent,
			startRow: HTMLElement,
			endRow: HTMLElement
		) => {
			if ( event.shiftKey ) {
				updateBlockSelection(
					event,
					// Tree grid rows carry `data-block`.
					startRow?.dataset?.block as string,
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
			let _blockDropTargetIndex: number | null | undefined;
			let _firstDraggedBlockIndex: number | undefined;

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
				style={
					// React styles take custom properties.
					{
						'--wp-admin--list-view-dragged-items-height':
							draggedClientIds?.length
								? `${
										BLOCK_LIST_ITEM_HEIGHT *
										( draggedClientIds.length - 1 )
									}px`
								: null,
					} as CSSProperties
				}
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
			{ showContentPopover && (
				<ListViewContentPopover listViewRef={ elementRef } />
			) }
		</AsyncModeProvider>
	);
}

// This is the private API for the ListView component.
// It allows access to all props, not just the public ones.
export const PrivateListView = forwardRef( ListViewComponent );

// This is the public API for the ListView component.
// We wrap the PrivateListView component to hide some props from the public API.
export default forwardRef< HTMLElement, ListViewProps >( ( props, ref ) => {
	return (
		<PrivateListView
			ref={ ref }
			{ ...props }
			showAppender={ false }
			rootClientId={ null }
			onSelect={ null }
			additionalBlockContent={ null }
			blockSettingsMenu={ undefined }
			showContentPopover={ false }
		/>
	);
} );
