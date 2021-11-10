/**
 * External dependencies
 */
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { AsyncModeProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ListViewBlock from './block';
import { useListViewContext } from './context';
import { isClientIdSelected } from './utils';

/**
 * Given a block, returns the total number of blocks in that subtree. This is used to help determine
 * the list position of a block.
 *
 * When a block is collapsed, we do not count their children as part of that total. In the current drag
 * implementation dragged blocks and their children are not counted.
 *
 * @param {Object} block            block tree
 * @param {Object} expandedState    state that notes which branches are collapsed
 * @param {Array}  draggedClientIds a list of dragged client ids
 * @return {number} block count
 */
function countBlocks( block, expandedState, draggedClientIds ) {
	const isDragged = draggedClientIds?.includes( block.clientId );
	if ( isDragged ) {
		return 0;
	}
	const isExpanded = expandedState[ block.clientId ] ?? true;
	if ( isExpanded ) {
		return (
			1 +
			block.innerBlocks.reduce(
				countReducer( expandedState, draggedClientIds ),
				0
			)
		);
	}
	return 1;
}
const countReducer = ( expandedState, draggedClientIds ) => (
	count,
	block
) => {
	const isDragged = draggedClientIds?.includes( block.clientId );
	if ( isDragged ) {
		return count;
	}
	const isExpanded = expandedState[ block.clientId ] ?? true;
	if ( isExpanded && block.innerBlocks.length > 0 ) {
		return count + countBlocks( block, expandedState, draggedClientIds );
	}
	return count + 1;
};

function ListViewBranch( props ) {
	const {
		blocks,
		selectBlock,
		showBlockMovers,
		showNestedBlocks,
		selectedClientIds,
		level = 1,
		path = '',
		isBranchSelected = false,
		listPosition = 0,
		fixedListWindow,
	} = props;

	const {
		expandedState,
		draggedClientIds,
		__experimentalPersistentListViewFeatures,
	} = useListViewContext();

	const filteredBlocks = compact( blocks );
	const blockCount = filteredBlocks.length;
	let nextPosition = listPosition;

	return (
		<>
			{ filteredBlocks.map( ( block, index ) => {
				const { clientId, innerBlocks } = block;

				if ( index > 0 ) {
					nextPosition += countBlocks(
						filteredBlocks[ index - 1 ],
						expandedState,
						draggedClientIds
					);
				}

				const usesWindowing = __experimentalPersistentListViewFeatures;

				const { itemInView } = fixedListWindow;

				const blockInView =
					! usesWindowing || itemInView( nextPosition );

				const position = index + 1;
				const updatedPath =
					path.length > 0
						? `${ path }_${ position }`
						: `${ position }`;
				const hasNestedBlocks =
					showNestedBlocks && !! innerBlocks && !! innerBlocks.length;

				const isExpanded = hasNestedBlocks
					? expandedState[ clientId ] ?? true
					: undefined;

				const isDragged = !! draggedClientIds?.includes( clientId );

				const showBlock = isDragged || blockInView;

				// Make updates to the selected or dragged blocks synchronous,
				// but asynchronous for any other block.
				const isSelected = isClientIdSelected(
					clientId,
					selectedClientIds
				);
				const isSelectedBranch =
					isBranchSelected || ( isSelected && hasNestedBlocks );
				return (
					<AsyncModeProvider key={ clientId } value={ ! isSelected }>
						{ showBlock && (
							<ListViewBlock
								block={ block }
								selectBlock={ selectBlock }
								isSelected={ isSelected }
								isBranchSelected={ isSelectedBranch }
								isDragged={ isDragged }
								level={ level }
								position={ position }
								rowCount={ blockCount }
								siblingBlockCount={ blockCount }
								showBlockMovers={ showBlockMovers }
								path={ updatedPath }
								isExpanded={ isExpanded }
								listPosition={ nextPosition }
							/>
						) }
						{ ! showBlock && (
							<tr>
								<td className="block-editor-list-view-placeholder" />
							</tr>
						) }
						{ hasNestedBlocks && isExpanded && ! isDragged && (
							<ListViewBranch
								blocks={ innerBlocks }
								selectBlock={ selectBlock }
								showBlockMovers={ showBlockMovers }
								showNestedBlocks={ showNestedBlocks }
								level={ level + 1 }
								path={ updatedPath }
								listPosition={ nextPosition + 1 }
								fixedListWindow={ fixedListWindow }
								isBranchSelected={ isSelectedBranch }
								selectedClientIds={ selectedClientIds }
							/>
						) }
					</AsyncModeProvider>
				);
			} ) }
		</>
	);
}

ListViewBranch.defaultProps = {
	selectBlock: () => {},
};

export default memo( ListViewBranch );
