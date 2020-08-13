/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';

function DownloadableBlocksList( { items, onHover = noop, onSelect } ) {
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
						onClick={ () => {
							installBlockType( item ).then( ( success ) => {
								if ( success ) {
									onSelect( item );
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
