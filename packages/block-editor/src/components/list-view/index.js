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
import {
	__experimentalTreeGrid as TreeGrid,
	VisuallyHidden,
} from '@wordpress/components';
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
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import ListViewBranch from './branch';
import { ListViewContext } from './context';
import ListViewDropIndicatorPreview from './drop-indicator';
import useBlockSelection from './use-block-selection';
import useListViewBlockIndexes from './use-list-view-block-indexes';
import useListViewClientIds from './use-list-view-client-ids';
import useListViewCollapseItems from './use-list-view-collapse-items';
import useListViewDropZone from './use-list-view-drop-zone';
import useListViewExpandSelectedItem from './use-list-view-expand-selected-item';
import { store as blockEditorStore } from '../../store';
import { BlockSettingsDropdown } from '../block-settings-menu/block-settings-dropdown';
import { focusListItem } from './utils';
import useClipboardHandler from './use-clipboard-handler';

const expanded = ( state, action ) => {
	if ( action.type === 'clear' ) {
		// Sync to module-level storage
		persistedExpandedState = {};
		return {};
	}
	if ( Array.isArray( action.clientIds ) ) {
		const newState = {
			...state,
			...action.clientIds.reduce(
				( accumulator, clientId ) => ( {
					...accumulator,
					[ clientId ]: action.type === 'expand',
				} ),
				{}
			),
		};
		// Sync to module-level storage
		persistedExpandedState = newState;
		return newState;
	}
	return state;
};

export const BLOCK_LIST_ITEM_HEIGHT = 32;

/**
 * Default maximum number of visible blocks in the list view before collapsing deeper levels.
 * This helps maintain performance and usability with deeply nested block structures.
 * Can be overridden via user preferences.
 */
const DEFAULT_MAX_VISIBLE_BLOCKS = 20;

/**
 * Enable debug logging for dynamic expansion calculations.
 * Set to true to see detailed logs of the expansion algorithm.
 */
const DEBUG_DYNAMIC_EXPANSION = false;

// Module-level storage for expanded state (persists across component mounts)
let persistedExpandedState = {};
let hasDynamicExpansionBeenApplied = false;
let previousBlockCount = 0;
let previousTopLevelClientIds = [];

/** @typedef {import('react').ComponentType} ComponentType */
/** @typedef {import('react').Ref<HTMLElement>} Ref */

/**
 * Debug logger for dynamic expansion.
 *
 * @param {...*} args Arguments to log.
 */
function debug( ...args ) {
	if ( DEBUG_DYNAMIC_EXPANSION ) {
		// eslint-disable-next-line no-console
		console.log( '[List View Dynamic Expansion]', ...args );
	}
}

/**
 * Counts total blocks recursively.
 *
 * @param {Array} blocks The blocks to count.
 * @return {number} Total count of all blocks.
 */
function countTotalBlocks( blocks ) {
	if ( ! blocks?.length ) {
		return 0;
	}

	let count = blocks.length;
	blocks.forEach( ( block ) => {
		if ( block.innerBlocks?.length > 0 ) {
			count += countTotalBlocks( block.innerBlocks );
		}
	} );

	return count;
}

/**
 * Finds the maximum depth of the block tree.
 *
 * @param {Array}  blocks       The blocks to analyze.
 * @param {number} currentDepth Current recursion depth.
 * @return {number} Maximum depth found.
 */
function getMaxBlockDepth( blocks, currentDepth = 1 ) {
	if ( ! blocks?.length ) {
		return currentDepth - 1;
	}

	let maxDepth = currentDepth;
	blocks.forEach( ( block ) => {
		if ( block.innerBlocks?.length > 0 ) {
			const childDepth = getMaxBlockDepth(
				block.innerBlocks,
				currentDepth + 1
			);
			maxDepth = Math.max( maxDepth, childDepth );
		}
	} );

	return maxDepth;
}

/**
 * Counts total visible items when expanding up to a certain depth.
 * Uses early exit optimization to stop counting once maxVisibleBlocks is exceeded.
 *
 * @param {Array}  blocks           The blocks to count.
 * @param {number} maxDepth         Maximum depth to expand.
 * @param {number} maxVisibleBlocks Maximum visible blocks threshold.
 * @param {number} currentDepth     Current recursion depth.
 * @return {number} Total count of visible items (may exceed maxVisibleBlocks).
 */
function countVisibleItems(
	blocks,
	maxDepth,
	maxVisibleBlocks,
	currentDepth = 1
) {
	if ( ! blocks?.length ) {
		return 0;
	}

	// Count all blocks at this level
	let count = blocks.length;

	debug(
		`  Counting depth ${ currentDepth }/${ maxDepth }: ${ blocks.length } blocks`
	);

	// Early exit: if we've already exceeded the limit, no need to continue
	if ( count > maxVisibleBlocks ) {
		debug(
			`  Early exit at depth ${ currentDepth }: ${ count } > ${ maxVisibleBlocks }`
		);
		return count;
	}

	// Recurse if we haven't gone beyond the visible range
	// When expanding to depth N, blocks at depth N+1 are visible (but collapsed)
	if ( currentDepth < maxDepth ) {
		for ( const block of blocks ) {
			if ( block.innerBlocks?.length > 0 ) {
				count += countVisibleItems(
					block.innerBlocks,
					maxDepth,
					maxVisibleBlocks,
					currentDepth + 1
				);

				// Early exit as soon as we exceed the limit
				if ( count > maxVisibleBlocks ) {
					debug(
						`  Early exit after recursion: ${ count } > ${ maxVisibleBlocks }`
					);
					return count;
				}
			}
		}
	} else if ( currentDepth === maxDepth ) {
		// At max depth, count immediate children (they're visible but collapsed)
		for ( const block of blocks ) {
			if ( block.innerBlocks?.length > 0 ) {
				count += block.innerBlocks.length;

				// Early exit
				if ( count > maxVisibleBlocks ) {
					debug(
						`  Early exit at max depth: ${ count } > ${ maxVisibleBlocks }`
					);
					return count;
				}
			}
		}
	}

	debug( `  Depth ${ currentDepth } total: ${ count }` );
	return count;
}

/**
 * Collects all expandable block client IDs (blocks that have children).
 *
 * @param {Array}  blocks       The blocks to process.
 * @param {number} currentDepth Current recursion depth.
 * @return {Array} Array of all expandable client IDs.
 */
function collectAllExpandableBlocks( blocks, currentDepth = 1 ) {
	if ( ! blocks?.length ) {
		return [];
	}

	const clientIds = [];
	blocks.forEach( ( block ) => {
		if ( block.innerBlocks?.length > 0 ) {
			clientIds.push( block.clientId );
			clientIds.push(
				...collectAllExpandableBlocks(
					block.innerBlocks,
					currentDepth + 1
				)
			);
		}
	} );

	return clientIds;
}

/**
 * Determines the dynamic default expansion depth.
 * Starts from maximum possible depth and works down until ≤ maxVisibleBlocks.
 * Uses early exit optimization to stop as soon as a suitable depth is found.
 *
 * @param {Array}  blocks           The top-level blocks in the list view.
 * @param {number} maxVisibleBlocks Maximum visible blocks threshold.
 * @return {number} The default expansion depth (0 = no expansion, 1+ = expand to that depth).
 */
function getDynamicExpansionLevel( blocks, maxVisibleBlocks ) {
	if ( ! blocks?.length ) {
		return 0;
	}

	debug( '=== getDynamicExpansionLevel ===' );
	debug( 'Top-level blocks:', blocks.length );
	debug(
		`Goal: Find deepest level where total blocks ≤ ${ maxVisibleBlocks }`
	);

	// Find the maximum depth in the block tree
	const maxPossibleDepth = getMaxBlockDepth( blocks );
	debug( 'Maximum possible depth:', maxPossibleDepth );

	// Start from max depth and work down
	for ( let depth = maxPossibleDepth; depth >= 1; depth-- ) {
		debug( `\nTrying depth ${ depth }:` );
		const itemCount = countVisibleItems( blocks, depth, maxVisibleBlocks );
		debug( `Depth ${ depth }: ${ itemCount } items total` );

		if ( itemCount <= maxVisibleBlocks ) {
			debug(
				`✓ ${ itemCount } ≤ ${ maxVisibleBlocks }, using depth ${ depth }`
			);
			return depth;
		}

		debug(
			`✗ ${ itemCount } > ${ maxVisibleBlocks }, trying shallower depth`
		);
	}

	// If even depth 1 exceeds maxVisibleBlocks, return 0 (no expansion)
	debug( 'All depths exceed limit, returning depth 0 (collapsed)' );
	return 0;
}

/**
 * Recursively collects client IDs up to a specified depth.
 *
 * @param {Array}  blocks       The blocks to process.
 * @param {number} maxDepth     Maximum depth to expand.
 * @param {number} currentDepth Current recursion depth.
 * @return {Array} Array of client IDs to expand.
 */
function getClientIdsToDepth( blocks, maxDepth, currentDepth = 1 ) {
	if ( ! blocks?.length ) {
		return [];
	}

	const clientIds = [];
	blocks.forEach( ( block ) => {
		if ( block.innerBlocks?.length > 0 ) {
			clientIds.push( block.clientId );

			// Continue recursing up to max depth
			if ( currentDepth < maxDepth ) {
				clientIds.push(
					...getClientIdsToDepth(
						block.innerBlocks,
						maxDepth,
						currentDepth + 1
					)
				);
			}
		}
	} );

	return clientIds;
}

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

	const { getBlock } = useSelect( blockEditorStore );
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

	// Check if experiment is enabled via window.__experimentalFeatures
	const isExperimentEnabled =
		window?.__experimentalFeatures?.[
			'gutenberg-list-view-dynamic-expansion'
		] ?? false;

	// Get max visible blocks preference (experiment must be enabled)
	const maxVisibleBlocks = useSelect(
		( select ) => {
			if ( ! isExperimentEnabled ) {
				return null;
			}
			const { get } = select( preferencesStore );
			return (
				get( 'core/edit-post', 'dynamicListViewMaxBlocks' ) ??
				DEFAULT_MAX_VISIBLE_BLOCKS
			);
		},
		[ isExperimentEnabled ]
	);

	const { updateBlockSelection } = useBlockSelection();

	// Initialize with persisted state from module-level variable
	const [ expandedState, setExpandedState ] = useReducer(
		expanded,
		persistedExpandedState
	);

	// Apply dynamic expansion on initial load or when blocks are added (e.g., pattern insertion)
	useEffect( () => {
		// Skip if experiment is disabled
		if ( ! isExperimentEnabled ) {
			debug( 'Dynamic expansion experiment disabled' );
			return;
		}

		if ( ! clientIdsTree?.length ) {
			debug( 'No blocks, skipping' );
			return;
		}

		const currentBlockCount = countTotalBlocks( clientIdsTree );
		const currentTopLevelClientIds = clientIdsTree.map(
			( block ) => block.clientId
		);
		const isInitialLoad = ! hasDynamicExpansionBeenApplied;
		const hasNewBlocks = currentBlockCount > previousBlockCount;

		debug( '\n=== Dynamic Expansion Check ===' );
		debug( 'Experiment enabled:', isExperimentEnabled );
		debug( 'Max visible blocks setting:', maxVisibleBlocks );
		debug( 'Total blocks (recursive):', currentBlockCount );
		debug( 'Visible blocks (Core):', visibleBlockCount );
		debug( 'Top-level blocks:', currentTopLevelClientIds.length );
		debug( 'Is initial load:', isInitialLoad );
		debug( 'Has new blocks:', hasNewBlocks );

		// Check if top-level blocks have changed (replacement)
		const topLevelBlocksChanged =
			! previousTopLevelClientIds.every(
				( clientId, index ) =>
					clientId === currentTopLevelClientIds[ index ]
			) ||
			previousTopLevelClientIds.length !==
				currentTopLevelClientIds.length;

		debug( 'Top-level changed:', topLevelBlocksChanged );

		// Apply expansion if:
		// 1. Initial load (first time opening List View)
		// 2. New blocks were added (block count increased)
		// 3. Top-level blocks were replaced
		if ( isInitialLoad || hasNewBlocks || topLevelBlocksChanged ) {
			debug( '\n*** APPLYING DYNAMIC EXPANSION ***' );

			if ( isInitialLoad ) {
				hasDynamicExpansionBeenApplied = true;
			}
			previousBlockCount = currentBlockCount;
			previousTopLevelClientIds = currentTopLevelClientIds;

			// OPTIMIZATION: Quick check using Core's visibleBlockCount
			// If total blocks <= maxVisibleBlocks, we can expand everything!
			if ( visibleBlockCount <= maxVisibleBlocks ) {
				debug(
					`\nFast path: ${ visibleBlockCount } blocks ≤ ${ maxVisibleBlocks }`
				);
				debug( 'Expanding all blocks without depth calculation' );

				setExpandedState( { type: 'clear' } );
				const allClientIds =
					collectAllExpandableBlocks( clientIdsTree );

				if ( allClientIds.length > 0 ) {
					debug( `Expanding ${ allClientIds.length } blocks` );
					setExpandedState( {
						type: 'expand',
						clientIds: allClientIds,
					} );
				} else {
					debug( 'No expandable blocks (all leaf nodes)' );
				}
				return;
			}

			// OPTIMIZATION: If we have way too many blocks, we know we'll collapse
			if ( visibleBlockCount > maxVisibleBlocks * 3 ) {
				debug(
					`\nMany blocks detected: ${ visibleBlockCount } > ${
						maxVisibleBlocks * 3
					}`
				);
				debug( 'Likely will collapse, but checking optimal depth...' );
			}

			// Normal path: calculate optimal expansion depth
			const expansionDepth = getDynamicExpansionLevel(
				clientIdsTree,
				maxVisibleBlocks
			);
			debug( '\n=== Expansion Decision ===' );
			debug( 'Chosen depth:', expansionDepth );

			// Always clear expansion state first, then reapply
			setExpandedState( { type: 'clear' } );

			if ( expansionDepth > 0 ) {
				const clientIdsToExpand = getClientIdsToDepth(
					clientIdsTree,
					expansionDepth
				);
				debug(
					`Expanding ${ clientIdsToExpand.length } blocks to depth ${ expansionDepth }`
				);

				if ( clientIdsToExpand.length > 0 ) {
					setExpandedState( {
						type: 'expand',
						clientIds: clientIdsToExpand,
					} );
				}
			} else {
				debug( 'Depth = 0, all blocks collapsed' );
			}
		} else {
			debug( 'No expansion needed (no trigger conditions met)' );
		}
	}, [
		clientIdsTree,
		visibleBlockCount,
		isExperimentEnabled,
		maxVisibleBlocks,
	] );

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

	const { ref: dropZoneRef, target: blockDropTarget } = useListViewDropZone( {
		dropZoneElement,
		expandedState,
		setExpandedState,
	} );
	const elementRef = useRef();

	// Allow handling of copy, cut, and paste events.
	const clipBoardRef = useClipboardHandler( {
		selectBlock: selectEditorBlock,
	} );

	const treeGridRef = useMergeRefs( [
		clipBoardRef,
		elementRef,
		dropZoneRef,
		ref,
	] );

	const [ hasInitiallyFocused, setHasInitiallyFocused ] = useState( false );

	useEffect( () => {
		// If a blocks are already selected when the list view is initially
		// mounted, shift focus to the first selected block.
		if ( ! hasInitiallyFocused && selectedClientIds?.length ) {
			focusListItem( selectedClientIds[ 0 ], elementRef?.current );
			setHasInitiallyFocused( true );
		}
	}, [ hasInitiallyFocused, selectedClientIds ] );

	const expand = useCallback(
		( clientId ) => {
			if ( ! clientId ) {
				return;
			}
			const clientIds = Array.isArray( clientId )
				? clientId
				: [ clientId ];
			setExpandedState( { type: 'expand', clientIds } );
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
	const collapseAll = useCallback( () => {
		setExpandedState( { type: 'clear' } );
	}, [ setExpandedState ] );
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

	useListViewCollapseItems( {
		collapseAll,
		expand,
	} );

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

	const contextValue = useMemo(
		() => ( {
			blockDropPosition,
			blockDropTargetIndex,
			blockIndexes,
			draggedClientIds,
			expandedState,
			expand,
			firstDraggedBlockIndex,
			collapse,
			collapseAll,
			BlockSettingsMenu,
			listViewInstanceId: instanceId,
			AdditionalBlockContent,
			insertedBlock,
			setInsertedBlock,
			treeGridElementRef: elementRef,
			rootClientId,
		} ),
		[
			blockDropPosition,
			blockDropTargetIndex,
			blockIndexes,
			draggedClientIds,
			expandedState,
			expand,
			firstDraggedBlockIndex,
			collapse,
			collapseAll,
			BlockSettingsMenu,
			instanceId,
			AdditionalBlockContent,
			insertedBlock,
			setInsertedBlock,
			rootClientId,
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
