/**
 * External dependencies
 */
import { map, compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ListViewBlock from './block';
import ListViewAppender from './appender';
import { isClientIdSelected } from './utils';
import { useListViewContext } from './context';

function countBlocks( block, expandedState ) {
	const isExpanded = expandedState[ block.clientId ] ?? true;
	if ( isExpanded ) {
		return 1 + block.innerBlocks.reduce( countReducer( expandedState ), 0 );
	}
	return 1;
}
const countReducer = ( expandedState ) => ( count, block ) => {
	const isExpanded = expandedState[ block.clientId ] ?? true;
	if ( isExpanded && block.innerBlocks.length > 0 ) {
		return count + countBlocks( block, expandedState );
	}
	return count + 1;
};

const ITEM_HEIGHT = 36;

export default function ListViewBranch( props ) {
	const {
		blocks,
		selectBlock,
		showAppender,
		showBlockMovers,
		showNestedBlocks,
		parentBlockClientId,
		level = 1,
		terminatedLevels = [],
		path = [],
		isBranchSelected = false,
		isLastOfBranch = false,
		listPosition = 0,
		windowMeasurement,
		globalBlockCount,
	} = props;

	const {
		expandedState,
		expand,
		collapse,
		draggedClientIds,
		selectedClientIds,
		__experimentalPersistentListViewFeatures,
	} = useListViewContext();

	const isTreeRoot = ! parentBlockClientId;
	const filteredBlocks = compact( blocks );
	const itemHasAppender = ( parentClientId ) =>
		showAppender &&
		! isTreeRoot &&
		isClientIdSelected( parentClientId, selectedClientIds );
	const hasAppender = itemHasAppender( parentBlockClientId );
	// Add +1 to the rowCount to take the block appender into account.
	const blockCount = filteredBlocks.length;
	const rowCount = hasAppender ? blockCount + 1 : blockCount;
	const appenderPosition = rowCount;
	let nextPosition = listPosition;

	return (
		<>
			{ map( filteredBlocks, ( block, index ) => {
				const { clientId, innerBlocks } = block;
				const position = index + 1;
				const isLastRowAtLevel = rowCount === position;
				const updatedTerminatedLevels = isLastRowAtLevel
					? [ ...terminatedLevels, level ]
					: terminatedLevels;
				const updatedPath = [ ...path, position ];
				const hasNestedBlocks =
					showNestedBlocks && !! innerBlocks && !! innerBlocks.length;
				const hasNestedAppender = itemHasAppender( clientId );
				const hasNestedBranch = hasNestedBlocks || hasNestedAppender;

				const isSelected = isClientIdSelected(
					clientId,
					selectedClientIds
				);
				const isSelectedBranch =
					isBranchSelected || ( isSelected && hasNestedBranch );

				// Logic needed to target the last item of a selected branch which might be deeply nested.
				// This is currently only needed for styling purposes. See: `.is-last-of-selected-branch`.
				const isLastBlock = index === blockCount - 1;
				const isLast = isSelected || ( isLastOfBranch && isLastBlock );
				const isLastOfSelectedBranch =
					isLastOfBranch && ! hasNestedBranch && isLastBlock;

				const isExpanded = hasNestedBranch
					? expandedState[ clientId ] ?? true
					: undefined;

				const selectBlockWithClientId = ( event ) => {
					event.stopPropagation();
					selectBlock( clientId );
				};

				const toggleExpanded = ( event ) => {
					event.stopPropagation();
					if ( isExpanded === true ) {
						collapse( clientId );
					} else if ( isExpanded === false ) {
						expand( clientId );
					}
				};

				// Make updates to the selected or dragged blocks synchronous,
				// but asynchronous for any other block.
				const isDragged = !! draggedClientIds?.includes( clientId );

				if ( index > 0 ) {
					nextPosition += countBlocks(
						filteredBlocks[ index - 1 ],
						expandedState
					);
				}
				const { start, maxVisible } = windowMeasurement;
				const end = start + maxVisible;

				// Only use windowing for the persistent list view
				const blockInView =
					! __experimentalPersistentListViewFeatures ||
					( start <= nextPosition &&
						nextPosition <= start + maxVisible );

				const style = {
					...( __experimentalPersistentListViewFeatures &&
					start === nextPosition
						? { paddingTop: ITEM_HEIGHT * start }
						: {} ),
					...( __experimentalPersistentListViewFeatures &&
					globalBlockCount > end &&
					end === nextPosition
						? {
								paddingBottom:
									ITEM_HEIGHT *
									( globalBlockCount - end - 1 ),
						  }
						: {} ),
				};
				return (
					<AsyncModeProvider key={ clientId } value={ ! isSelected }>
						{ blockInView && (
							<ListViewBlock
								block={ block }
								onClick={ selectBlockWithClientId }
								onToggleExpanded={ toggleExpanded }
								isDragged={ isDragged }
								isSelected={ isSelected }
								isBranchSelected={ isSelectedBranch }
								isLastOfSelectedBranch={
									isLastOfSelectedBranch
								}
								level={ level }
								position={ position }
								rowCount={ rowCount }
								siblingBlockCount={ blockCount }
								showBlockMovers={ showBlockMovers }
								terminatedLevels={ terminatedLevels }
								path={ updatedPath }
								isExpanded={ isExpanded }
								listPosition={ nextPosition }
								style={ style }
							/>
						) }
						{ hasNestedBranch && isExpanded && ! isDragged && (
							<ListViewBranch
								blocks={ innerBlocks }
								selectBlock={ selectBlock }
								isBranchSelected={ isSelectedBranch }
								isLastOfBranch={ isLast }
								showAppender={ showAppender }
								showBlockMovers={ showBlockMovers }
								showNestedBlocks={ showNestedBlocks }
								parentBlockClientId={ clientId }
								level={ level + 1 }
								terminatedLevels={ updatedTerminatedLevels }
								path={ updatedPath }
								listPosition={ nextPosition + 1 }
								windowMeasurement={ windowMeasurement }
								globalBlockCount={ globalBlockCount }
							/>
						) }
					</AsyncModeProvider>
				);
			} ) }
			{ hasAppender && (
				<ListViewAppender
					parentBlockClientId={ parentBlockClientId }
					position={ rowCount }
					rowCount={ appenderPosition }
					level={ level }
					terminatedLevels={ terminatedLevels }
					path={ [ ...path, appenderPosition ] }
				/>
			) }
		</>
	);
}

ListViewBranch.defaultProps = {
	selectBlock: () => {},
};
