/**
 * WordPress dependencies
 */
import {
	__experimentalTreeGridRow as TreeGridRow,
	__experimentalTreeGridCell as TreeGridCell,
} from '@wordpress/components';
import { memo } from '@wordpress/element';
import { AsyncModeProvider, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Appender } from './appender';
import ListViewBlock from './block';
import { useListViewContext } from './context';
import {
	BLOCK_LIST_ITEM_HEIGHT,
	getDragDisplacementValues,
	isClientIdSelected,
} from './utils';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Given a block, returns the total number of blocks in that subtree. This is used to help determine
 * the list position of a block.
 *
 * When a block is collapsed, we do not count their children as part of that total. In the current drag
 * implementation dragged blocks and their children are not counted.
 *
 * @param {Object}  block               block tree
 * @param {Object}  expansionState      state that notes which branches are collapsed
 * @param {Array}   draggedClientIds    a list of dragged client ids
 * @param {boolean} isExpandedByDefault flag to determine the default fallback expanded state.
 * @return {number} block count
 */
function countBlocks(
	block,
	expansionState,
	draggedClientIds,
	isExpandedByDefault
) {
	const isDragged = draggedClientIds?.includes( block.clientId );
	if ( isDragged ) {
		return 0;
	}
	const isExpanded = expansionState[ block.clientId ] ?? isExpandedByDefault;
	if ( ! isExpanded ) {
		return 1;
	}
	return block.innerBlocks.reduce(
		( count, innerBlock ) =>
			count +
			countBlocks(
				innerBlock,
				expansionState,
				draggedClientIds,
				isExpandedByDefault
			),
		1
	);
}

const noop = () => {};

function ListViewBranch( props ) {
	const {
		blocks,
		selectBlock = noop,
		showBlockMovers,
		selectedClientIds,
		level = 1,
		path = '',
		isBranchSelected = false,
		listPosition = 0,
		fixedListWindow,
		isExpanded,
		parentId,
		shouldShowInnerBlocks = true,
		isSyncedBranch = false,
		showAppender: showAppenderProp = true,
	} = props;

	const { canParentExpand, isParentSynced } = useSelect(
		( select ) => {
			if ( ! parentId ) {
				return { canParentExpand: true, isParentSynced: false };
			}
			const { canEditBlock, isSyncedBlock } = unlock(
				select( blockEditorStore )
			);
			return {
				canParentExpand: canEditBlock( parentId ),
				isParentSynced: isSyncedBlock( parentId ),
			};
		},
		[ parentId ]
	);

	const syncedBranch = isSyncedBranch || isParentSynced;

	const {
		blockDropPosition,
		blockDropTargetIndex,
		firstDraggedBlockIndex,
		blockIndexes,
		expansionState,
		draggedClientIds,
	} = useListViewContext();

	if ( ! canParentExpand ) {
		return null;
	}

	// Only show the appender at the first level.
	const showAppender = showAppenderProp && level === 1;
	const filteredBlocks = blocks.filter( Boolean );
	const blockCount = filteredBlocks.length;
	// The appender means an extra row in List View, so add 1 to the row count.
	const rowCount = showAppender ? blockCount + 1 : blockCount;
	let nextPosition = listPosition;

	const rows = [];

	// A run of blocks outside of the render window becomes one spacer row that
	// stands in for their height.
	let placeholderRows = 0;
	let placeholderKey;

	// Adds the pending placeholder row, if there is one. Call before
	// adding a real row.
	const pushPlaceholderRow = () => {
		if ( ! placeholderRows ) {
			return;
		}
		rows.push(
			<tr key={ `placeholder-${ placeholderKey }` }>
				<td
					className="block-editor-list-view-placeholder"
					style={ {
						height: placeholderRows * BLOCK_LIST_ITEM_HEIGHT,
					} }
				/>
			</tr>
		);
		placeholderRows = 0;
		placeholderKey = undefined;
	};

	filteredBlocks.forEach( ( block, index ) => {
		const { clientId, innerBlocks } = block;

		// The next sibling is offset by this block's subtree.
		const blockListPosition = nextPosition;
		nextPosition += countBlocks(
			block,
			expansionState,
			draggedClientIds,
			isExpanded
		);

		const isDragged = !! draggedClientIds?.includes( clientId );

		const { itemInView } = fixedListWindow;
		const blockInView = itemInView( blockListPosition );

		const position = index + 1;
		const updatedPath =
			path.length > 0 ? `${ path }_${ position }` : `${ position }`;
		const hasNestedBlocks = !! innerBlocks?.length;

		const shouldExpand =
			hasNestedBlocks && shouldShowInnerBlocks
				? expansionState[ clientId ] ?? isExpanded
				: undefined;

		// Make updates to the selected or dragged blocks synchronous,
		// but asynchronous for any other block.
		const isSelected = isClientIdSelected( clientId, selectedClientIds );
		const isSelectedBranch =
			isBranchSelected || ( isSelected && hasNestedBlocks );

		// To avoid performance issues, we only render blocks that are in view,
		// or blocks that are selected or dragged. If a block is selected,
		// it is only counted if it is the first of the block selection.
		// This prevents the entire tree from being rendered when a branch is
		// selected, or a user selects all blocks, while still enabling scroll
		// into view behavior when selecting a block or opening the list view.
		// The first and last blocks of the list are always rendered, to ensure
		// that Home and End keys work as expected.
		const showBlock =
			isDragged ||
			blockInView ||
			( isSelected && clientId === selectedClientIds[ 0 ] ) ||
			index === 0 ||
			index === blockCount - 1;

		const showNestedBlocks = hasNestedBlocks && shouldExpand && ! isDragged;

		if ( ! showBlock ) {
			placeholderRows += 1;
			placeholderKey ??= clientId;

			// Inner blocks of an off-window block may still be in view.
			if ( ! showNestedBlocks ) {
				return;
			}
		}

		pushPlaceholderRow();

		// Determine the displacement of the block while dragging. This
		// works out whether the current block should be displaced up or
		// down, relative to the dragged blocks and the drop target.
		const { displacement, isAfterDraggedBlocks, isNesting } =
			getDragDisplacementValues( {
				blockIndexes,
				blockDropTargetIndex,
				blockDropPosition,
				clientId,
				firstDraggedBlockIndex,
				isDragged,
			} );

		rows.push(
			<AsyncModeProvider key={ clientId } value={ ! isSelected }>
				{ showBlock && (
					<ListViewBlock
						clientId={ clientId }
						selectBlock={ selectBlock }
						isSelected={ isSelected }
						isBranchSelected={ isSelectedBranch }
						isDragged={ isDragged }
						level={ level }
						position={ position }
						rowCount={ rowCount }
						siblingBlockCount={ blockCount }
						showBlockMovers={ showBlockMovers }
						path={ updatedPath }
						isExpanded={ isDragged ? false : shouldExpand }
						listPosition={ blockListPosition }
						selectedClientIds={ selectedClientIds }
						isSyncedBranch={ syncedBranch }
						displacement={ displacement }
						isAfterDraggedBlocks={ isAfterDraggedBlocks }
						isNesting={ isNesting }
					/>
				) }
				{ showNestedBlocks && (
					<ListViewBranch
						parentId={ clientId }
						blocks={ innerBlocks }
						selectBlock={ selectBlock }
						showBlockMovers={ showBlockMovers }
						level={ level + 1 }
						path={ updatedPath }
						listPosition={ blockListPosition + 1 }
						fixedListWindow={ fixedListWindow }
						isBranchSelected={ isSelectedBranch }
						selectedClientIds={ selectedClientIds }
						isExpanded={ isExpanded }
						isSyncedBranch={ syncedBranch }
					/>
				) }
			</AsyncModeProvider>
		);
	} );

	pushPlaceholderRow();

	return (
		<>
			{ rows }
			{ showAppender && (
				<TreeGridRow
					level={ level }
					setSize={ rowCount }
					positionInSet={ rowCount }
					isExpanded
				>
					<TreeGridCell>
						{ ( treeGridCellProps ) => (
							<Appender
								clientId={ parentId }
								nestingLevel={ level }
								blockCount={ blockCount }
								{ ...treeGridCellProps }
							/>
						) }
					</TreeGridCell>
				</TreeGridRow>
			) }
		</>
	);
}

export default memo( ListViewBranch );
