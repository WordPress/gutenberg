/**
 * WordPress dependencies
 */
import {
	useInstanceId,
	useMergeRefs,
	__experimentalUseFixedWindowList as useFixedWindowList,
} from '@wordpress/compose';
import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import {
	useCallback,
	useEffect,
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
import { ListViewContext } from './context';
import ListViewDropIndicator from './drop-indicator';
import useBlockSelection from './use-block-selection';
import useListViewClientIds from './use-list-view-client-ids';
import useListViewDropZone from './use-list-view-drop-zone';
import useListViewExpandSelectedItem from './use-list-view-expand-selected-item';
import { store as blockEditorStore } from '../../store';
import { BlockSettingsDropdown } from '../block-settings-menu/block-settings-dropdown';

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

/** @typedef {import('react').ComponentType} ComponentType */
/** @typedef {import('react').Ref<HTMLElement>} Ref */

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

	const { getBlock } = useSelect( blockEditorStore );
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
		[ draggedClientIds ]
	);

	const { updateBlockSelection } = useBlockSelection();

	const [ expandedState, setExpandedState ] = useReducer( expanded, {} );

	const { ref: dropZoneRef, target: blockDropTarget } = useListViewDropZone( {
		dropZoneElement,
	} );
	const elementRef = useRef();
	const treeGridRef = useMergeRefs( [ elementRef, dropZoneRef, ref ] );

	const isMounted = useRef( false );

	const [ insertedBlock, setInsertedBlock ] = useState( null );

	const { setSelectedTreeId } = useListViewExpandSelectedItem( {
		firstSelectedBlockClientId: selectedClientIds[ 0 ],
		setExpandedState,
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
	useEffect( () => {
		isMounted.current = true;
	}, [] );

	const expand = useCallback(
		( clientId ) => {
			if ( ! clientId ) {
				return;
			}
			setExpandedState( { type: 'expand', clientIds: [ clientId ] } );
		},
		[ setExpandedState ]
	);
	const collapse = useCallback(
		( clientId ) => {
			if ( ! clientId ) {
				return;
			}
			setExpandedState( { type: 'collapse', clientIds: [ clientId ] } );
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
			BlockSettingsMenu,
			listViewInstanceId: instanceId,
			AdditionalBlockContent,
			insertedBlock,
			setInsertedBlock,
			treeGridElementRef: elementRef,
		} ),
		[
			draggedClientIds,
			expandedState,
			expand,
			collapse,
			BlockSettingsMenu,
			instanceId,
			AdditionalBlockContent,
			insertedBlock,
			setInsertedBlock,
		]
	);

	// List View renders a fixed number of items and relies on each having a fixed item height of 36px.
	// If this value changes, we should also change the itemHeight value set in useFixedWindowList.
	// See: https://github.com/WordPress/gutenberg/pull/35230 for additional context.
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
			expandedState,
			useWindowing: true,
			windowOverscan: 40,
		}
	);

	// If there are no blocks to show and we're not showing the appender, do not render the list view.
	if ( ! clientIdsTree.length && ! showAppender ) {
		return null;
	}

	return (
		<AsyncModeProvider value={ true }>
			<ListViewDropIndicator
				listViewRef={ elementRef }
				blockDropTarget={ blockDropTarget }
			/>
			<TreeGrid
				id={ id }
				className="block-editor-list-view-tree"
				aria-label={ __( 'Block navigation structure' ) }
				ref={ treeGridRef }
				onCollapseRow={ collapseRow }
				onExpandRow={ expandRow }
				onFocusRow={ focusRow }
				applicationAriaLabel={ __( 'Block navigation structure' ) }
				// eslint-disable-next-line jsx-a11y/aria-props
				aria-description={ description }
			>
				<ListViewContext.Provider value={ contextValue }>
					<ListViewBranch
						blocks={ clientIdsTree }
						parentId={ rootClientId }
						selectBlock={ selectEditorBlock }
						showBlockMovers={ showBlockMovers }
						fixedListWindow={ fixedListWindow }
						selectedClientIds={ selectedClientIds }
						isExpanded={ isExpanded }
						shouldShowInnerBlocks={ shouldShowInnerBlocks }
						showAppender={ showAppender }
					/>
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
