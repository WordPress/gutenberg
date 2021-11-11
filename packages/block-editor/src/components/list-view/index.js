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
	if ( ! Array.isArray( action.clientIds ) ) {
		return state;
	}

	switch ( action.type ) {
		case 'expand': {
			return Object.fromEntries(
				Object.entries( state ).filter( ( [ key ] ) => {
					return ! action.clientIds.includes( key );
				} )
			);
		}
		case 'collapse': {
			return {
				...state,
				...action.clientIds.reduce( ( newState, id ) => {
					newState[ id ] = false;
					return newState;
				}, {} ),
			};
		}
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
	const { selectBlock } = useDispatch( blockEditorStore );
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
		( clientId ) => {
			selectBlock( clientId );
			onSelect( clientId );
		},
		[ selectBlock, onSelect ]
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
		( clientIds ) => {
			if ( ! clientIds ) {
				return;
			}
			setExpandedState( { type: 'expand', clientIds } );
		},
		[ setExpandedState ]
	);
	const collapse = useCallback(
		( clientIds ) => {
			if ( ! clientIds ) {
				return;
			}
			setExpandedState( { type: 'collapse', clientIds } );
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
