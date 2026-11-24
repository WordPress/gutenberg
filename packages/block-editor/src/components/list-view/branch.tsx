import type { ReactElement } from 'react';
import {
	__experimentalTreeGridRow as TreeGridRow,
	__experimentalTreeGridCell as TreeGridCell,
} from '@wordpress/components';
import { memo } from '@wordpress/element';
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { Appender } from './appender';
import ListViewBlock from './block';
import { useInsertedBlockClientId, useListViewTreeState } from './context';
import {
	BLOCK_LIST_ITEM_HEIGHT,
	getDragDisplacementValues,
	isClientIdSelected,
} from './utils';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { ClientIdsTreeNode } from '../../store/types';
import type { ListViewBranchProps, ListViewExpansionState } from './types';

/**
 * Given a block, returns the total number of blocks in that subtree. This is used to help determine
 * the list position of a block.
 *
 * When a block is collapsed, we do not count their children as part of that total. In the current drag
 * implementation dragged blocks and their children are not counted.
 *
 * @param block               block tree
 * @param expansionState      state that notes which branches are collapsed
 * @param draggedClientIds    a list of dragged client ids
 * @param isExpandedByDefault flag to determine the default fallback expanded state.
 * @return block count
 */
function countBlocks(
	block: ClientIdsTreeNode,
	expansionState: ListViewExpansionState,
	draggedClientIds: string[] | undefined,
	isExpandedByDefault: boolean | undefined
): number {
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

function ListViewBranch( props: ListViewBranchProps ) {
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
		isSyncedBranch = false,
		showAppender: showAppenderProp = true,
		isLastBranch = true,
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
	} = useListViewTreeState();
	const insertedBlockClientId = useInsertedBlockClientId();

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

	const rows: ReactElement[] = [];

	// A run of blocks outside of the render window becomes one spacer row that
	// stands in for their height.
	let placeholderRows = 0;
	let placeholderKey: string | undefined;

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

		const { start, end, focusedClientId } = fixedListWindow;
		// A block counts as in view when any row of its subtree is, so the
		// ancestors of every rendered row stay mounted and Arrow Left can
		// reach the parent.
		const blockInView = blockListPosition < end && nextPosition > start;

		const position = index + 1;
		const updatedPath =
			path.length > 0 ? `${ path }_${ position }` : `${ position }`;
		const hasNestedBlocks = !! innerBlocks?.length;

		const shouldExpand = hasNestedBlocks
			? ( expansionState[ clientId ] ?? isExpanded )
			: undefined;

		// Make updates to the selected or dragged blocks synchronous,
		// but asynchronous for any other block. The block just inserted from
		// the appender is being edited through its popover, so its row stays
		// synchronous too, even though nothing is selected.
		const isSelected = isClientIdSelected( clientId, selectedClientIds );
		const isSync = isSelected || clientId === insertedBlockClientId;
		const isSelectedBranch =
			isBranchSelected || ( isSelected && hasNestedBlocks );

		const isFirstSelected = clientId === selectedClientIds[ 0 ];
		const isLastInList = isLastBranch && index === blockCount - 1;
		// Outside the window a row stays mounted when unmounting it would stop
		// its drag, drop focus, keep the selection from scrolling into view,
		// or leave Home and End without the list's first and last rows.
		const showBlock =
			blockInView ||
			isDragged ||
			clientId === focusedClientId ||
			isFirstSelected ||
			( level === 1 && index === 0 ) ||
			isLastInList;

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
			<AsyncModeProvider key={ clientId } value={ ! isSync }>
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
						isLastBranch={ isLastInList }
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
