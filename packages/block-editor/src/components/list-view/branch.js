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
		level = 1,
		path = '',
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

	const listItems = [];
	for ( let index = 0; index < filteredBlocks.length; index++ ) {
		const block = filteredBlocks[ index ];
		const { clientId, innerBlocks } = block;

		if ( index > 0 ) {
			nextPosition += countBlocks(
				filteredBlocks[ index - 1 ],
				expandedState,
				draggedClientIds
			);
		}

		const usesWindowing = __experimentalPersistentListViewFeatures;

		const {
			start,
			end,
			itemInView,
			startPadding,
			endPadding,
		} = fixedListWindow;

		const blockInView = ! usesWindowing || itemInView( nextPosition );

		const isDragging = draggedClientIds?.length > 0;
		if (
			usesWindowing &&
			! isDragging &&
			! blockInView &&
			nextPosition > start
		) {
			// found the end of the window, don't bother processing the rest of the items
			break;
		}
		const style = usesWindowing
			? {
					paddingTop: start === nextPosition ? startPadding : 0,
					paddingBottom: end === nextPosition ? endPadding : 0,
			  }
			: undefined;

		const position = index + 1;
		const updatedPath =
			path.length > 0 ? `${ path }_${ position }` : `${ position }`;
		const hasNestedBlocks =
			showNestedBlocks && !! innerBlocks && !! innerBlocks.length;

		const isExpanded = hasNestedBlocks
			? expandedState[ clientId ] ?? true
			: undefined;

		// Make updates to the selected or dragged blocks synchronous,
		// but asynchronous for any other block.
		const isDragged = !! draggedClientIds?.includes( clientId );

		listItems.push(
			<Fragment key={ clientId }>
				{ ( isDragged || blockInView ) && (
					<ListViewBlock
						block={ block }
						selectBlock={ selectBlock }
						isDragged={ isDragged }
						level={ level }
						position={ position }
						rowCount={ blockCount }
						siblingBlockCount={ blockCount }
						showBlockMovers={ showBlockMovers }
						path={ updatedPath }
						isExpanded={ isExpanded }
						listPosition={ nextPosition }
						style={ style }
					/>
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
					/>
				) }
			</Fragment>
		);
	}
	return <>{ listItems }</>;
}

ListViewBranch.defaultProps = {
	selectBlock: () => {},
};

export default memo( ListViewBranch );
