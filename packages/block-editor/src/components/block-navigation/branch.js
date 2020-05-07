/**
 * WordPress dependencies
 */
import { Children, cloneElement, useContext } from '@wordpress/element';
import { Fill, Slot } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockNavigationListItem from './list-item';
import { BlockNavigationContext } from './list';
import { BlockListBlockContext } from '../block-list/block';

const BlockNavigationBranch = ( { children, ...props } ) => {
	const { __experimentalWithBlockNavigationSlots } = useContext(
		BlockNavigationContext
	);
	if ( ! __experimentalWithBlockNavigationSlots ) {
		return (
			<li>
				<BlockNavigationListItem { ...props } />
				{ children }
			</li>
		);
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

export default BlockNavigationBranch;

const listItemSlotName = ( blockId ) => `BlockNavigationList-item-${ blockId }`;

export const BlockNavigationListItemSlot = ( { blockId, ...props } ) => (
	<Slot { ...props } name={ listItemSlotName( blockId ) } />
);

export const BlockNavigationListItemFill = ( props ) => {
	const { clientId } = useContext( BlockListBlockContext );
	return <Fill { ...props } name={ listItemSlotName( clientId ) } />;
};
