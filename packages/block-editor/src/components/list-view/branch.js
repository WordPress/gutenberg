/**
 * External dependencies
 */
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ListViewBlock from './block';
import { useListViewContext } from './context';

/**
 * Given a block, returns the total number of blocks in that subtree. This is used to help determine
 * the list position of a block.
 *
 * When a block is collapsed, we do not count their children as part of that total.
 *
 * @param {Object} block         block tree
 * @param {Object} expandedState state that notes which branches are collapsed
 * @return {number} block count
 */
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

function ListViewBranch( props ) {
	const {
		blocks,
		selectBlock,
		showBlockMovers,
		showNestedBlocks,
		level = 1,
		fixedListWindow,
		animateToggleOpen = false,
		setPosition,
		moveItem,
		listPosition = 0,
		draggingId,
		dragStart,
		dragEnd,
	} = props;

	const {
		expandedState,
		draggedClientIds,
		__experimentalPersistentListViewFeatures,
		isTreeGridMounted,
		useAnimation,
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
				const hasNestedBlocks =
					showNestedBlocks && !! innerBlocks && !! innerBlocks.length;

				const isExpanded = hasNestedBlocks
					? expandedState[ clientId ] ?? true
					: undefined;

				const isDragged = !! draggedClientIds?.includes( clientId );

				const animateToggle =
					useAnimation &&
					( animateToggleOpen ||
						( isExpanded &&
							isTreeGridMounted &&
							expandedState[ clientId ] !== undefined ) );

				const showBlock = isDragged || blockInView;
				return (
					<Fragment key={ clientId }>
						{ showBlock && (
							<ListViewBlock
								block={ block }
								selectBlock={ selectBlock }
								isDragged={ isDragged }
								level={ level }
								position={ position }
								rowCount={ blockCount }
								siblingBlockCount={ blockCount }
								showBlockMovers={ showBlockMovers }
								isExpanded={ isExpanded }
								animateToggleOpen={ animateToggle }
								setPosition={ setPosition }
								moveItem={ moveItem }
								listPosition={ nextPosition }
								draggingId={ draggingId }
								dragStart={ () => dragStart( clientId ) }
								dragEnd={ () => dragEnd( clientId ) }
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
								listPosition={ nextPosition + 1 }
								fixedListWindow={ fixedListWindow }
								animateToggleOpen={ animateToggle }
								setPosition={ setPosition }
								moveItem={ moveItem }
								draggingId={ draggingId }
								dragStart={ dragStart }
								dragEnd={ dragEnd }
							/>
						) }
					</Fragment>
				);
			} ) }
		</>
	);
}

ListViewBranch.defaultProps = {
	selectBlock: () => {},
};

export default memo( ListViewBranch );
