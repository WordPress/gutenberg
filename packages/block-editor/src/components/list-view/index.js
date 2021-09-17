/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { AsyncModeProvider, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useReducer,
	useState,
	forwardRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ListViewBranch from './branch';
import { ListViewContext } from './context';
import useListViewClientIds from './use-list-view-client-ids';
import { store as blockEditorStore } from '../../store';
import {
	removeItemFromTree,
	addItemToTree,
	addChildItemToTree,
	findFirstValidSibling,
} from './utils';

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
 * @param {string}   props.rootId                                   Parent id of blocks. Defaults to '' as root.
 * @param {Array}    props.blocks                                   Custom subset of block client IDs to be used
 *                                                                  instead of the default hierarchy.
 * @param {Function} props.onSelect                                 Block selection callback.
 * @param {boolean}  props.showNestedBlocks                         Flag to enable displaying nested blocks.
 * @param {boolean}  props.showOnlyCurrentHierarchy                 Flag to limit the list to the current hierarchy of
 *                                                                  blocks.
 * @param {boolean}  props.__experimentalFeatures                   Flag to enable experimental features.
 * @param {boolean}  props.__experimentalPersistentListViewFeatures Flag to enable features for the Persistent List
 *                                                                  View experiment.
 * @param {Object}   ref                                            Forwarded ref
 */
function ListView(
	{
		rootId = '',
		blocks,
		showOnlyCurrentHierarchy,
		onSelect = noop,
		__experimentalFeatures,
		__experimentalPersistentListViewFeatures,
		...props
	},
	ref
) {
	const { clientIdsTree, selectedClientIds } = useListViewClientIds(
		blocks,
		showOnlyCurrentHierarchy,
		__experimentalPersistentListViewFeatures
	);
	const { selectBlock, moveBlocksToPosition } = useDispatch(
		blockEditorStore
	);
	const selectEditorBlock = useCallback(
		( clientId ) => {
			selectBlock( clientId );
			onSelect( clientId );
		},
		[ selectBlock, onSelect ]
	);

	const isMounted = useRef( false );

	useEffect( () => {
		isMounted.current = true;
	}, [] );

	// State and callback functions used to support expand/collapse functions
	const [ expandedState, setExpandedState ] = useReducer( expanded, {} );
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

	// Layout animations should be disabled when folks prefer reduced motion.
	const useAnimation = ! useReducedMotion();

	// Dragging Support
	//
	// To support in-place item swapping when dragging, we use local component state by deep copying the client ids tree
	// and manipulating it. We still do want to listen to global updates, so we only use local component state while
	// dragging. To facilitate what the component is driven by, we use stateType which has three states, and transitions
	// between them in the following way:
	//
	// GLOBAL         ----------(drag start)----------> LOCAL
	// LOCAL          -------------(drop)-------------> RESOLVING_DROP
	// RESOLVING_DROP --(error/clientIdTrees update)--> GLOBAL
	//
	// Note that a RESOLVING_DROP state is necessary. Otherwise, we'll see valid moves jumping from it's dropped position
	// to its old position and back to its dropped position.
	const LOCAL = 'local';
	const RESOLVING_DROP = 'resolving-drop';
	const GLOBAL = 'global';
	const [ stateType, setStateType ] = useState( GLOBAL );
	const [ tree, setTree ] = useState( clientIdsTree );
	const [ draggingId, setDraggingId ] = useState( null );
	useEffect( () => {
		if ( draggingId ) {
			setStateType( LOCAL );
			setTree( clientIdsTree );
		}
	}, [ draggingId ] );
	useEffect( () => {
		// stateType is intentionally omitted from useEffect dependencies
		// we want the next instance of where clientIdsTree updates after we drop an item
		if ( stateType === RESOLVING_DROP ) {
			setStateType( GLOBAL );
		}
	}, [ clientIdsTree ] );

	const positionsRef = useRef( {} );
	const positions = positionsRef.current;
	const setPosition = useCallback(
		( clientId, offset ) => ( positions[ clientId ] = offset ),
		[ positions ]
	);

	// Used in dragging to specify a drop target
	const lastTarget = useRef( null );

	const dragStart = useCallback(
		( clientId ) => {
			if ( ! draggingId && stateType === GLOBAL ) {
				setDraggingId( clientId );
				collapse( clientId );
			}
		},
		[ draggingId, stateType, setDraggingId, collapse ]
	);

	// Fired on item drop
	const dropItem = useCallback( async () => {
		const target = lastTarget.current;
		if ( ! target ) {
			setStateType( GLOBAL );
			return;
		}
		const { clientId, originalParent, targetId, targetIndex } = target;
		lastTarget.current = null;
		try {
			setStateType( RESOLVING_DROP );
			await moveBlocksToPosition(
				[ clientId ],
				originalParent,
				targetId,
				targetIndex
			);
		} catch ( e ) {
			setStateType( GLOBAL );
		}
	}, [ lastTarget.current, setStateType ] );

	const dragEnd = useCallback(
		( clientId ) => {
			dropItem();
			setDraggingId( null );
			expand( clientId );
		},
		[ dropItem, setDraggingId, expand ]
	);

	// Note that this is fired on onViewportBoxUpdate instead of onDrag.
	const moveItem = useCallback(
		( { block, translate, translateX, listPosition, velocity } ) => {
			const ITEM_HEIGHT = 36;
			const LEFT_RIGHT_DRAG_THRESHOLD = 15;
			const UP = 'up';
			const DOWN = 'down';

			const { clientId } = block;

			const v = velocity?.get() ?? 0;
			if ( v === 0 ) {
				return;
			}

			const direction = v > 0 ? DOWN : UP;

			const draggingUpPastBounds =
				positions[ listPosition + 1 ] === undefined &&
				direction === UP &&
				translate > 0;
			const draggingDownPastBounds =
				listPosition === 0 && direction === DOWN && translate < 0;

			if ( draggingUpPastBounds || draggingDownPastBounds ) {
				// If we've dragged past all items with the first or last item, don't start checking for potential swaps
				// until we're near other items
				return;
			}

			if (
				( direction === DOWN && translate < 0 ) ||
				( direction === UP && translate > 0 )
			) {
				//We're skipping over multiple items, wait until user catches up to the new slot
				return;
			}

			if ( Math.abs( translate ) < ITEM_HEIGHT / 2 ) {
				// Don't bother calculating anything if we haven't moved half a step.
				return;
			}

			if ( Math.abs( translateX ) > LEFT_RIGHT_DRAG_THRESHOLD ) {
				// If we move to the right or left as we drag, allow more freeform targeting
				// so we can find a new parent container
				const steps = Math.ceil( Math.abs( translate / ITEM_HEIGHT ) );
				const nextIndex =
					direction === UP
						? listPosition - steps
						: listPosition + steps;

				const targetPosition = positions[ nextIndex ];

				if ( ! targetPosition ) {
					return;
				}
				if (
					targetPosition.dropSibling &&
					( translateX < 0 ||
						( translateX > 0 && ! targetPosition.dropContainer ) )
				) {
					//Insert as a sibling
					const {
						newTree: treeWithoutDragItem,
						removeParentId,
					} = removeItemFromTree( clientIdsTree, clientId, rootId );
					const { newTree, targetIndex, targetId } = addItemToTree(
						treeWithoutDragItem,
						targetPosition.clientId,
						block,
						direction === DOWN ||
							( direction === UP &&
								targetPosition.isLastChild &&
								! targetPosition.dropContainer ),
						rootId
					);
					lastTarget.current = {
						clientId,
						originalParent: removeParentId,
						targetId,
						targetIndex,
					};
					setTree( newTree );
					return;
				}

				if (
					targetPosition.dropContainer &&
					( translateX > 0 ||
						( translateX < 0 && ! targetPosition.dropSibling ) )
				) {
					//Nest block under parent
					const {
						newTree: treeWithoutDragItem,
						removeParentId,
					} = removeItemFromTree( clientIdsTree, clientId, rootId );
					const newTree = addChildItemToTree(
						treeWithoutDragItem,
						targetPosition.clientId,
						block
					);
					lastTarget.current = {
						clientId,
						originalParent: removeParentId,
						targetId: targetPosition.clientId,
						targetIndex: 0,
					};
					setTree( newTree );
					return;
				}
			}

			// If we drag straight up or down, find the next valid sibling to swap places with:
			const [ targetPosition, nextIndex ] = findFirstValidSibling(
				positions,
				listPosition,
				v
			);

			if (
				targetPosition &&
				Math.abs( translate ) >
					( ITEM_HEIGHT * Math.abs( listPosition - nextIndex ) ) / 2
			) {
				//Sibling swap
				const {
					newTree: treeWithoutDragItem,
					removeParentId,
				} = removeItemFromTree( clientIdsTree, clientId, rootId );
				const { newTree, targetIndex, targetId } = addItemToTree(
					treeWithoutDragItem,
					targetPosition.clientId,
					block,
					direction === DOWN,
					rootId
				);
				lastTarget.current = {
					clientId,
					originalParent: removeParentId,
					targetId,
					targetIndex,
				};
				setTree( newTree );
			}
		},
		[ clientIdsTree, positions ]
	);

	const contextValue = useMemo(
		() => ( {
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			isTreeGridMounted: isMounted.current,
			selectedClientIds,
			expandedState,
			expand,
			collapse,
			useAnimation,
		} ),
		[
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			isMounted.current,
			selectedClientIds,
			expandedState,
			expand,
			collapse,
			useAnimation,
		]
	);

	return (
		<AsyncModeProvider value={ true }>
			<TreeGrid
				className="block-editor-list-view-tree"
				aria-label={ __( 'Block navigation structure' ) }
				ref={ ref }
				onCollapseRow={ collapseRow }
				onExpandRow={ expandRow }
				useAnimation={ useAnimation }
			>
				<ListViewContext.Provider value={ contextValue }>
					<ListViewBranch
						blocks={
							stateType === LOCAL || stateType === RESOLVING_DROP
								? tree
								: clientIdsTree
						}
						parentBlockClientId={ rootId }
						selectBlock={ selectEditorBlock }
						selectedBlockClientIds={ selectedClientIds }
						setPosition={ setPosition }
						moveItem={ moveItem }
						draggingId={ draggingId }
						dragStart={ dragStart }
						dragEnd={ dragEnd }
						{ ...props }
					/>
				</ListViewContext.Provider>
			</TreeGrid>
		</AsyncModeProvider>
	);
}
export default forwardRef( ListView );
