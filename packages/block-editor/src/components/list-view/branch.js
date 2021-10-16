/**
 * External dependencies
 */
import { map, compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ListViewBlock from './block';
import { useListViewContext } from './context';

export default function ListViewBranch( props ) {
	const {
		blocks,
		selectBlock,
		showBlockMovers,
		showNestedBlocks,
		level = 1,
		path = '',
	} = props;

	const { expandedState, draggedClientIds } = useListViewContext();

	const filteredBlocks = compact( blocks );
	// Add +1 to the rowCount to take the block appender into account.
	const blockCount = filteredBlocks.length;

	return (
		<>
			{ map( filteredBlocks, ( block, index ) => {
				const { clientId, innerBlocks } = block;
				const position = index + 1;
				// If the string value changes, it's used to trigger an animation change.
				// This may be removed if we use a different animation library in the future.
				const updatedPath =
					path.length > 0
						? `${ path }_${ position }`
						: `${ position }`;
				const hasNestedBlocks =
					showNestedBlocks && !! innerBlocks && !! innerBlocks.length;

				const isExpanded = hasNestedBlocks
					? expandedState[ clientId ] ?? true
					: undefined;

				// Make updates to the selected or dragged blocks synchronous,
				// but asynchronous for any other block.
				const isDragged = !! draggedClientIds?.includes( clientId );

				return (
					<Fragment key={ clientId }>
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
						/>
						{ hasNestedBlocks && isExpanded && ! isDragged && (
							<ListViewBranch
								blocks={ innerBlocks }
								selectBlock={ selectBlock }
								showBlockMovers={ showBlockMovers }
								showNestedBlocks={ showNestedBlocks }
								level={ level + 1 }
								path={ updatedPath }
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
