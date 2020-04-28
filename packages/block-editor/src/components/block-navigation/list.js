/**
 * External dependencies
 */
import { isNil, map, omitBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Slot, Fill } from '@wordpress/components';
import {
	Children,
	cloneElement,
	useContext,
	createContext,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockNavigationListItem from './list-item';
import ButtonBlockAppender from '../button-block-appender';
import { BlockListBlockContext } from '../block-list/block';

export const BlockNavigationContext = createContext( {
	withBlockNavigationSlots: true,
} );

export default function BlockNavigationList( {
	blocks,
	selectedBlockClientId,
	selectBlock,
	showAppender,

	// Internal use only.
	showNestedBlocks,
	parentBlockClientId,
} ) {
	const { withBlockNavigationSlots } = useContext( BlockNavigationContext );
	const shouldShowAppender = showAppender && !! parentBlockClientId;

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul className="block-editor-block-navigation__list" role="list">
			{ map( omitBy( blocks, isNil ), ( block ) => {
				const isSelected = block.clientId === selectedBlockClientId;
				return (
					<BlockNavigationBranch
						withSlot={ withBlockNavigationSlots }
						block={ block }
						key={ block.clientId }
						isSelected={ isSelected }
						onClick={ () => selectBlock( block.clientId ) }
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
					</BlockNavigationBranch>
				);
			} ) }
			{ shouldShowAppender && (
				<li>
					<div className="block-editor-block-navigation__item">
						<ButtonBlockAppender
							rootClientId={ parentBlockClientId }
							__experimentalSelectBlockOnInsert={ false }
						/>
					</div>
				</li>
			) }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

BlockNavigationList.defaultProps = {
	selectBlock: () => {},
};

const BlockNavigationBranch = ( { withSlot, children, ...props } ) => {
	if ( ! withSlot ) {
		return <BlockNavigationListItem { ...props } />;
	}

	return (
		<li>
			<BlockNavigationListItemSlot blockId={ props.block.clientId }>
				{ ( fills ) => {
					if ( ! fills.length ) {
						return <BlockNavigationListItem { ...props } />;
					}

					return Children.map( fills, ( fill ) =>
						cloneElement( fill, {
							...props,
							...fill.props,
						} )
					);
				} }
			</BlockNavigationListItemSlot>
			{ children }
		</li>
	);
};

const listItemSlotName = ( blockId ) => `BlockNavigationList-item-${ blockId }`;

export const BlockNavigationListItemSlot = ( { blockId, ...props } ) => (
	<Slot { ...props } name={ listItemSlotName( blockId ) } />
);
export const BlockNavigationListItemFill = ( props ) => {
	const { clientId } = useContext( BlockListBlockContext );
	return <Fill { ...props } name={ listItemSlotName( clientId ) } />;
};
