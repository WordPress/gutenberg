/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */

import { useMergeRefs } from '@wordpress/compose';
import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { AsyncModeProvider, useDispatch } from '@wordpress/data';
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
	const nextState = { ...state };

	switch ( action.type ) {
		case 'expand': {
			castArray( action.clientIds ).forEach( ( clientId ) => {
				nextState[ clientId ] = true;
			} );
			break;
		}
		case 'collapse': {
			castArray( action.clientIds ).forEach( ( clientId ) => {
				nextState[ clientId ] = false;
			} );
			break;
		}
	}

	return nextState;
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
 * @param {boolean}  props.showOnlyCurrentHierarchy                 Flag to limit the list to the current hierarchy of blocks.
 * @param {boolean}  props.__experimentalFeatures                   Flag to enable experimental features.
 * @param {boolean}  props.__experimentalPersistentListViewFeatures Flag to enable features for the Persistent List View experiment.
 * @param {Object}   ref                                            Forwarded ref
 */
function ListView(
	{
		blocks,
		showOnlyCurrentHierarchy,
		onSelect = noop,
		__experimentalFeatures,
		__experimentalPersistentListViewFeatures,
		...props
	},
	ref
) {
	const {
		clientIdsTree,
		selectedClientIds,
		draggedClientIds,
	} = useListViewClientIds(
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
	const [ expandedState, setExpandedState ] = useReducer( expanded, {} );

	const { ref: dropZoneRef, target: blockDropTarget } = useListViewDropZone();
	const elementRef = useRef();
	const treeGridRef = useMergeRefs( [ elementRef, dropZoneRef, ref ] );

	const isMounted = useRef( false );
	useEffect( () => {
		isMounted.current = true;
	}, [] );

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
	const expandRow = ( row ) => {
		expand( row?.dataset?.block );
	};
	const collapseRow = ( row ) => {
		collapse( row?.dataset?.block );
	};

	const contextValue = useMemo(
		() => ( {
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			isTreeGridMounted: isMounted.current,
			draggedClientIds,
			selectedClientIds,
			expandedState,
			expand,
			collapse,
		} ),
		[
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			isMounted.current,
			draggedClientIds,
			selectedClientIds,
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
						{ ...props }
					/>
				</ListViewContext.Provider>
			</TreeGrid>
		</AsyncModeProvider>
	);
}
export default forwardRef( ListView );
