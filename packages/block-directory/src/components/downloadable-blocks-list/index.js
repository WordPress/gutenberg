/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';
import { store as blockDirectoryStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { CompositeV2: Composite, useCompositeStoreV2: useCompositeStore } =
	unlock( componentsPrivateApis );
const noop = () => {};

function DownloadableBlocksList( { items, onHover = noop, onSelect } ) {
	const composite = useCompositeStore();
	const { installBlockType } = useDispatch( blockDirectoryStore );

	if ( ! items.length ) {
		return null;
	}

	return (
		<Composite
			store={ composite }
			role="listbox"
			className="block-directory-downloadable-blocks-list"
			aria-label={ __( 'Blocks available for install' ) }
		>
			{ items.map( ( item ) => {
				return (
					<DownloadableBlockListItem
						key={ item.id }
						composite={ composite }
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
