/**
 * WordPress dependencies
 */
import {
	useMergeRefs,
	__experimentalUseFixedWindowList as useFixedWindowList,
} from '@wordpress/compose';
import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { AsyncModeProvider, useDispatch, useSelect } from '@wordpress/data';
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
import useListViewClientIds from './use-list-view-client-ids';
import useListViewDropZone from './use-list-view-drop-zone';
import { store as blockEditorStore } from '../../store';

const noop = () => {};
const expanded = ( state, action ) => {
	switch ( action.type ) {
		case 'expand':
			return { ...state, ...{ [ action.clientId ]: true } };
		case 'collapse':
			return { ...state, ...{ [ action.clientId ]: false } };
		default:
			return state;
	}
};

/**
 * Wrap `ListViewRows` with `TreeGrid`. ListViewRows is a
 * recursive component (it renders itself), so this ensures TreeGrid is only
 * present at the very top of the navigation grid.
 *
 * @param {Object}   props                                          Components props.
 * @param {Array}    props.blocks                                   Custom subset of block client IDs to be used instead of the default hierarchy.
 * @param {Function} props.onSelect                                 Block selection callback.
 * @param {boolean}  props.showNestedBlocks                         Flag to enable displaying nested blocks.
 * @param {boolean}  props.showBlockMovers                          Flag to enable block movers
 * @param {boolean}  props.__experimentalFeatures                   Flag to enable experimental features.
 * @param {boolean}  props.__experimentalPersistentListViewFeatures Flag to enable features for the Persistent List View experiment.
 * @param {boolean}  props.__experimentalHideContainerBlockActions  Flag to hide actions of top level blocks (like core/widget-area)
 * @param {Object}   ref                                            Forwarded ref
 */
function ListView(
	{
		blocks,
		onSelect = noop,
		__experimentalFeatures,
		__experimentalPersistentListViewFeatures,
		__experimentalHideContainerBlockActions,
		showNestedBlocks,
		showBlockMovers,
		...props
	},
	ref
) {
	const {
		clientIdsTree,
		draggedClientIds,
		selectedClientIds,
	} = useListViewClientIds( blocks );
	const { clearSelectedBlock, multiSelect, selectBlock } = useDispatch(
		blockEditorStore
	);
	const {
		getBlockParents,
		getBlockSelectionStart,
		hasMultiSelection,
		hasSelectedBlock,
	} = useSelect( blockEditorStore );

	const { visibleBlockCount } = useSelect(
		( select ) => {
			const { getGlobalBlockCount, getClientIdsOfDescendants } = select(
				blockEditorStore
			);
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
	const selectEditorBlock = useCallback(
		async ( clientId, event ) => {
			if ( ! event.shiftKey ) {
				await clearSelectedBlock();
				selectBlock( clientId, -1 );
			} else if ( event.shiftKey ) {
				// To handle multiple block selection via the `SHIFT` key, prevent
				// the browser default behavior of opening the link in a new window.
				event.preventDefault();

				// Select a single block if no block is selected yet.
				if ( ! hasSelectedBlock() && ! hasMultiSelection() ) {
					selectBlock( clientId, -1 );
					return;
				}

				const blockSelectionStart = getBlockSelectionStart();

				// By checking `blockSelectionStart` to be set, we handle the
				// case where we select a single block. We also have to check
				// the selectionEnd (clientId) not to be included in the
				// `blockSelectionStart`'s parents because the click event is
				// propagated.
				const startParents = getBlockParents( blockSelectionStart );

				if (
					blockSelectionStart &&
					blockSelectionStart !== clientId &&
					! startParents?.includes( clientId )
				) {
					const startPath = [ ...startParents, blockSelectionStart ];
					const endPath = [
						...getBlockParents( clientId ),
						clientId,
					];
					const depth =
						Math.min( startPath.length, endPath.length ) - 1;
					const start = startPath[ depth ];
					const end = endPath[ depth ];

					// Handle the case of having selected a parent block and
					// then shift+click on a child.
					if ( start !== end ) {
						multiSelect( start, end );
					}
				}
			}
			onSelect( clientId );
		},
		[
			clearSelectedBlock,
			getBlockParents,
			getBlockSelectionStart,
			hasMultiSelection,
			hasSelectedBlock,
			multiSelect,
			selectBlock,
			onSelect,
		]
	);
	const [ expandedState, setExpandedState ] = useReducer( expanded, {} );

	const { ref: dropZoneRef, target: blockDropTarget } = useListViewDropZone();
	const elementRef = useRef();
	const treeGridRef = useMergeRefs( [ elementRef, dropZoneRef, ref ] );

	const isMounted = useRef( false );
	useEffect( () => {
		isMounted.current = true;
	}, [] );

	// List View renders a fixed number of items and relies on each having a fixed item height of 36px.
	// If this value changes, we should also change the itemHeight value set in useFixedWindowList.
	// See: https://github.com/WordPress/gutenberg/pull/35230 for additional context.
	const [ fixedListWindow ] = useFixedWindowList(
		elementRef,
		36,
		visibleBlockCount,
		{
			useWindowing: __experimentalPersistentListViewFeatures,
			windowOverscan: 40,
		}
	);

	const expand = useCallback(
		( clientId ) => {
			if ( ! clientId ) {
				return;
			}
			setExpandedState( { type: 'expand', clientId } );
		},
		[ setExpandedState ]
	);
	const collapse = useCallback(
		( clientId ) => {
			if ( ! clientId ) {
				return;
			}
			setExpandedState( { type: 'collapse', clientId } );
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

	const contextValue = useMemo(
		() => ( {
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			__experimentalHideContainerBlockActions,
			isTreeGridMounted: isMounted.current,
			draggedClientIds,
			expandedState,
			expand,
			collapse,
		} ),
		[
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			__experimentalHideContainerBlockActions,
			isMounted.current,
			draggedClientIds,
			expandedState,
			expand,
			collapse,
		]
	);

	return (
		<AsyncModeProvider value={ true }>
			<ListViewDropIndicator
				listViewRef={ elementRef }
				blockDropTarget={ blockDropTarget }
			/>
			<TreeGrid
				className="block-editor-list-view-tree"
				aria-label={ __( 'Block navigation structure' ) }
				ref={ treeGridRef }
				onCollapseRow={ collapseRow }
				onExpandRow={ expandRow }
			>
				<ListViewContext.Provider value={ contextValue }>
					<ListViewBranch
						blocks={ clientIdsTree }
						selectBlock={ selectEditorBlock }
						showNestedBlocks={ showNestedBlocks }
						showBlockMovers={ showBlockMovers }
						fixedListWindow={ fixedListWindow }
						selectedClientIds={ selectedClientIds }
						{ ...props }
					/>
				</ListViewContext.Provider>
			</TreeGrid>
		</AsyncModeProvider>
	);
}
export default forwardRef( ListView );
