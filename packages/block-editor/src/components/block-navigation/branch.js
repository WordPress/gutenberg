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
import BlockNavigationBlock from './block';
import BlockNavigationAppender from './appender';

export default function BlockNavigationBranch( props ) {
	const {
		blocks,
		selectBlock,
		selectedBlockClientId,
		showAppender,
		showBlockMovers,
		showNestedBlocks,
		parentBlockClientId,
		level = 1,
		terminatedLevels = [],
		path = [],
		highlightBlocksOnHover,
	} = props;

	const isTreeRoot = ! parentBlockClientId;
	const filteredBlocks = compact( blocks );
	const itemHasAppender = ( parentClientId ) =>
		showAppender &&
		! isTreeRoot &&
		selectedBlockClientId === parentClientId;
	const hasAppender = itemHasAppender( parentBlockClientId );
	// Add +1 to the rowCount to take the block appender into account.
	const blockCount = filteredBlocks.length;
	const rowCount = hasAppender ? blockCount + 1 : blockCount;
	const appenderPosition = rowCount;

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

				return (
					<Fragment key={ clientId }>
						<BlockNavigationBlock
							block={ block }
							onClick={ selectBlock }
							isSelected={ selectedBlockClientId === clientId }
							level={ level }
							position={ position }
							rowCount={ rowCount }
							siblingBlockCount={ blockCount }
							showBlockMovers={ showBlockMovers }
							terminatedLevels={ terminatedLevels }
							path={ updatedPath }
							highlightBlocksOnHover={ highlightBlocksOnHover }
						/>
						{ ( hasNestedBlocks || hasNestedAppender ) && (
							<BlockNavigationBranch
								blocks={ innerBlocks }
								selectedBlockClientId={ selectedBlockClientId }
								selectBlock={ selectBlock }
								showAppender={ showAppender }
								showBlockMovers={ showBlockMovers }
								showNestedBlocks={ showNestedBlocks }
								parentBlockClientId={ clientId }
								level={ level + 1 }
								terminatedLevels={ updatedTerminatedLevels }
								path={ updatedPath }
								highlightBlocksOnHover={
									highlightBlocksOnHover
								}
							/>
						) }
					</Fragment>
				);
			} ) }
			{ hasAppender && (
				<BlockNavigationAppender
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

BlockNavigationBranch.defaultProps = {
	selectBlock: () => {},
};
