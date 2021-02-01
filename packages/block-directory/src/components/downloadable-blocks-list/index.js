/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';
import { store as blockDirectoryStore } from '../../store';

function DownloadableBlocksList( { items, onHover = noop, onSelect } ) {
	const { installBlockType } = useDispatch( blockDirectoryStore );

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
						onClick={ () => {
							// Check if the block is registered (`getBlockType`
							// will return an object). If so, insert the block.
							// This prevents installing existing plugins.
							if ( getBlockType( item.name ) ) {
								onSelect( item );
							} else {
								installBlockType( item ).then( ( success ) => {
									if ( success ) {
										onSelect( item );
									}
								} );
							}
							onHover( null );
						} }
						item={ item }
					/>
				);
			} ) }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default DownloadableBlocksList;
