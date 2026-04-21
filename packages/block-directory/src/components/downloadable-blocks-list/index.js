/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Composite } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';
import { store as blockDirectoryStore } from '../../store';

const noop = () => {};

function DownloadableBlocksList( { items, onHover = noop, onSelect } ) {
	const { installBlockType } = useDispatch( blockDirectoryStore );

	if ( ! items.length ) {
		return null;
	}

	return (
		<Composite
			role="listbox"
			className="block-directory-downloadable-blocks-list"
			aria-label={ __( 'Blocks available for install' ) }
		>
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
						onHover={ onHover }
						item={ item }
					/>
				);
			} ) }
		</Composite>
	);
}

export default DownloadableBlocksList;
