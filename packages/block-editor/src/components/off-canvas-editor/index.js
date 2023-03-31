/**
 * WordPress dependencies
 */
import {
	useMergeRefs,
	__experimentalUseFixedWindowList as useFixedWindowList,
} from '@wordpress/compose';
import {
	__experimentalTreeGrid as TreeGrid,
	__experimentalTreeGridRow as TreeGridRow,
	__experimentalTreeGridCell as TreeGridCell,
} from '@wordpress/components';
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useReducer,
	forwardRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ListViewBranch from './branch';
import { ListViewContext } from './context';
import ListViewDropIndicator from './drop-indicator';
import useBlockSelection from './use-block-selection';
import useListViewClientIds from './use-list-view-client-ids';
import useListViewDropZone from './use-list-view-drop-zone';
import useListViewExpandSelectedItem from './use-list-view-expand-selected-item';
import { store as blockEditorStore } from '../../store';

const expanded = ( state, action ) => {
	if ( Array.isArray( action.clientIds ) ) {
		return {
			...state,
			...action.clientIds.reduce(
				( newState, id ) => ( {
					...newState,
					[ id ]: action.type === 'expand',
				} ),
				{}
			),
		};
	}
	return state;
};

export const BLOCK_LIST_ITEM_HEIGHT = 36;

/**
 * Show a hierarchical list of blocks.
 *
 * @param {Object}   props                         Components props.
 * @param {string}   props.id                      An HTML element id for the root element of ListView.
 * @param {string}   props.parentClientId          The client id of the parent block.
 * @param {Array}    props.blocks                  Custom subset of block client IDs to be used instead of the default hierarchy.
 * @param {boolean}  props.showBlockMovers         Flag to enable block movers
 * @param {boolean}  props.isExpanded              Flag to determine whether nested levels are expanded by default.
 * @param {Object}   props.LeafMoreMenu            Optional more menu substitution.
 * @param {string}   props.description             Optional accessible description for the tree grid component.
 * @param {string}   props.onSelect                Optional callback to be invoked when a block is selected.
 * @param {string}   props.showAppender            Flag to show or hide the block appender.
 * @param {Function} props.renderAdditionalBlockUI Function that renders additional block content UI.
 * @param {Object}   ref                           Forwarded ref.
 */
function OffCanvasEditor(
	{
		id,
		parentClientId,
		blocks,
		showBlockMovers = false,
		isExpanded = false,
		showAppender = true,
		LeafMoreMenu,
		description = __( 'Block navigation structure' ),
		onSelect,
		renderAdditionalBlockUI,
	},
	ref
) {
	const { getBlock } = useSelect( blockEditorStore );
	const { clientIdsTree, draggedClientIds, selectedClientIds } =
		useListViewClientIds( blocks );

	const { visibleBlockCount, shouldShowInnerBlocks } = useSelect(
		( select ) => {
			const {
				getGlobalBlockCount,
				getClientIdsOfDescendants,
				__unstableGetEditorMode,
			} = select( blockEditorStore );
			const draggedBlockCount =
				draggedClientIds?.length > 0
					? getClientIdsOfDescendants( draggedClientIds ).length + 1
					: 0;
			return {
				visibleBlockCount: getGlobalBlockCount() - draggedBlockCount,
				shouldShowInnerBlocks: __unstableGetEditorMode() !== 'zoom-out',
			};
		},
		[ draggedClientIds, blocks ]
	);

	const { updateBlockSelection } = useBlockSelection();

	const [ expandedState, setExpandedState ] = useReducer( expanded, {} );

	const { ref: dropZoneRef, target: blockDropTarget } = useListViewDropZone();
	const elementRef = useRef();
	const treeGridRef = useMergeRefs( [ elementRef, dropZoneRef, ref ] );

	const isMounted = useRef( false );
	const { setSelectedTreeId } = useListViewExpandSelectedItem( {
		firstSelectedBlockClientId: selectedClientIds[ 0 ],
		setExpandedState,
	} );
	const selectEditorBlock = useCallback(
		( event, blockClientId ) => {
			updateBlockSelection( event, blockClientId );
			setSelectedTreeId( blockClientId );
			if ( onSelect ) {
				onSelect( getBlock( blockClientId ) );
			}
		},
		[ setSelectedTreeId, updateBlockSelection, onSelect, getBlock ]
	);
	useEffect( () => {
		isMounted.current = true;
	}, [] );

	// List View renders a fixed number of items and relies on each having a fixed item height of 36px.
	// If this value changes, we should also change the itemHeight value set in useFixedWindowList.
	// See: https://github.com/WordPress/gutenberg/pull/35230 for additional context.
	const [ fixedListWindow ] = useFixedWindowList(
		elementRef,
		BLOCK_LIST_ITEM_HEIGHT,
		visibleBlockCount,
		{
			useWindowing: true,
			windowOverscan: 40,
		}
	);

	const expand = useCallback(
		( blockClientId ) => {
			if ( ! blockClientId ) {
				return;
			}
			setExpandedState( {
				type: 'expand',
				clientIds: [ blockClientId ],
			} );
		},
		[ setExpandedState ]
	);
	const collapse = useCallback(
		( blockClientId ) => {
			if ( ! blockClientId ) {
				return;
			}
			setExpandedState( {
				type: 'collapse',
				clientIds: [ blockClientId ],
			} );
		},
		[ setExpandedState ]
	);
	const expandRow = useCallback(
		( row ) => {
			expand( row?.dataset?.block );
		},
		[ expand ]
	);
	const collapseRow = useCallback(
		( row ) => {
			collapse( row?.dataset?.block );
		},
		[ collapse ]
	);
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

	const contextValue = useMemo(
		() => ( {
			isTreeGridMounted: isMounted.current,
			draggedClientIds,
			expandedState,
			expand,
			collapse,
			LeafMoreMenu,
			renderAdditionalBlockUI,
		} ),
		[
			isMounted.current,
			draggedClientIds,
			expandedState,
			expand,
			collapse,
			LeafMoreMenu,
			renderAdditionalBlockUI,
		]
	);

	return (
		<AsyncModeProvider value={ true }>
			<ListViewDropIndicator
				listViewRef={ elementRef }
				blockDropTarget={ blockDropTarget }
			/>
			<div className="offcanvas-editor-list-view-tree-wrapper">
				<TreeGrid
					id={ id }
					className="block-editor-list-view-tree"
					aria-label={ __( 'Block navigation structure' ) }
					ref={ treeGridRef }
					onCollapseRow={ collapseRow }
					onExpandRow={ expandRow }
					onFocusRow={ focusRow }
					// eslint-disable-next-line jsx-a11y/aria-props
					aria-description={ description }
				>
					<ListViewContext.Provider value={ contextValue }>
						<ListViewBranch
							parentId={ parentClientId }
							blocks={ clientIdsTree }
							selectBlock={ selectEditorBlock }
							showBlockMovers={ showBlockMovers }
							fixedListWindow={ fixedListWindow }
							selectedClientIds={ selectedClientIds }
							isExpanded={ isExpanded }
							shouldShowInnerBlocks={ shouldShowInnerBlocks }
							showAppender={ showAppender }
						/>
						<TreeGridRow
							level={ 1 }
							setSize={ 1 }
							positionInSet={ 1 }
							isExpanded={ true }
						>
							{ ! clientIdsTree.length && (
								<TreeGridCell withoutGridItem>
									<div className="offcanvas-editor-list-view-is-empty">
										{ __(
											'Your menu is currently empty. Add your first menu item to get started.'
										) }
									</div>
								</TreeGridCell>
							) }
						</TreeGridRow>
					</ListViewContext.Provider>
				</TreeGrid>
			</div>
		</AsyncModeProvider>
	);
}

export default forwardRef( OffCanvasEditor );
