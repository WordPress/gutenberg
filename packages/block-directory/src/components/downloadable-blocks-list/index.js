/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';
import { store as blockDirectoryStore } from '../../store';

function DownloadableBlocksList( { items, onHover = noop, onSelect } ) {
	const { installBlockType } = useDispatch( blockDirectoryStore );
	const { setIsInserterOpened } = useDispatch( editPostStore );

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
							installBlockType( item ).then( ( success ) => {
								if ( success ) {
									onSelect( item );
									setIsInserterOpened( false );
								}
							} );
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
