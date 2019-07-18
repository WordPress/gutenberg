/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import DiscoverBlockListItem from '../discover-block-list-item';

function DiscoverBlocksList( { items, onSelect, onHover = () => {}, children } ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-editor-discover-blocks-list">
			{ items && items.map( ( item ) =>
				<DiscoverBlockListItem
					key={ item.id }
					className={ getBlockMenuDefaultClassName( item.id ) }
					icons={ item.icons }
					onClick={ () => {
						onSelect( item );
						onHover( null );
					} }
					onFocus={ () => onHover( item ) }
					onMouseEnter={ () => onHover( item ) }
					onMouseLeave={ () => onHover( null ) }
					onBlur={ () => onHover( null ) }
					isDisabled={ item.isDisabled }
					item={ item }
				/>
			) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default DiscoverBlocksList;
