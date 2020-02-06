/**
 * External dependencies
 */
import { isNil, map, omitBy } from 'lodash';

/**
 * Internal dependencies
 */
import BlockNavigationItem from './item';

export default function BlockNavigationList( {
	blocks,
	selectedBlockClientId,
	selectBlock,
	showAppender,

	// Internal use only.
	showNestedBlocks,
	parentBlockClientId,
} ) {
	const shouldShowAppender = showAppender && !! parentBlockClientId;

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul className="block-editor-block-navigation__list" role="list">
			{ map( omitBy( blocks, isNil ), ( block ) => {
				return (
					<BlockNavigationItem
						key={ block.clientId }
						block={ block }
						onClick={ () => selectBlock( block.clientId ) }
						isSelected={ block.clientId === selectedBlockClientId }
					>
						{ showNestedBlocks &&
							!! block.innerBlocks &&
							!! block.innerBlocks.length && (
								<BlockNavigationList
									blocks={ block.innerBlocks }
									selectedBlockClientId={
										selectedBlockClientId
									}
									selectBlock={ selectBlock }
									parentBlockClientId={ block.clientId }
									showAppender={ showAppender }
									showNestedBlocks
								/>
							) }
					</BlockNavigationItem>
				);
			} ) }
			{ shouldShowAppender && (
				<BlockNavigationItem.Appender
					parentBlockClientId={ parentBlockClientId }
				/>
			) }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}
