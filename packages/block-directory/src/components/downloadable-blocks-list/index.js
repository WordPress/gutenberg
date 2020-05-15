/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';

export function DownloadableBlocksList( {
	items,
	children,
	onHover = noop,
	onSelect,
} ) {
	const { installBlockType } = useDispatch( 'core/block-directory' );

	if ( ! items.length ) {
		return null;
	}

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-directory-downloadable-blocks-list">
			{ items.map( ( item ) => {
				return (
					<DownloadableBlockListItem
						key={ item.id }
						className={ getBlockMenuDefaultClassName( item.id ) }
						icons={ item.icons }
						onClick={ () => {
							installBlockType( item ).then( () => {
								onSelect( item );
							} );
							onHover( null );
						} }
						onFocus={ () => onHover( item ) }
						onMouseEnter={ () => onHover( item ) }
						onMouseLeave={ () => onHover( null ) }
						onBlur={ () => onHover( null ) }
						item={ item }
					/>
				);
			} ) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default DownloadableBlocksList;
