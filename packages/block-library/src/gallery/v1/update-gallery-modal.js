/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_MEDIA,
} from './constants';

export const updateGallery = ( {
	clientId,
	getBlock,
	replaceBlocks,
} ) => () => {
	let link;
	const {
		attributes: { sizeSlug, linkTo, images, caption },
	} = getBlock( clientId );

	switch ( linkTo ) {
		case 'post':
			link = LINK_DESTINATION_ATTACHMENT;
			break;
		case 'file':
			link = LINK_DESTINATION_MEDIA;
			break;
		default:
			link = LINK_DESTINATION_NONE;
			break;
	}
	const innerBlocks = images.map( ( image ) =>
		createBlock( 'core/image', {
			id: parseInt( image.id, 10 ),
			url: image.url,
			alt: image.alt,
			caption: image.caption,
			linkDestination: link,
		} )
	);

	replaceBlocks(
		clientId,
		createBlock(
			'core/gallery',
			{ sizeSlug, linkTo: link, caption },
			innerBlocks
		)
	);
};

export default function UpdateGalleryModal( { onClose, clientId } ) {
	const { getBlock } = useSelect( blockEditorStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	return (
		<Modal
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
			title={ __( 'Update gallery' ) }
			className={ 'wp-block-update-gallery-modal' }
			aria={ {
				describedby: 'wp-block-update-gallery-modal__description',
			} }
		>
			<p id={ 'wp-block-update-gallery-modal__description' }>
				{ __(
					'Updating to the new format adds the ability to use custom links or styles on individual images in the gallery, and makes it easier to add or move them around.'
				) }
			</p>

			<div className="wp-block-update-gallery-modal-buttons">
				<Button isTertiary onClick={ onClose }>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					isPrimary
					onClick={ updateGallery( {
						replaceBlocks,
						getBlock,
						clientId,
						createBlock,
					} ) }
				>
					{ __( 'Update' ) }
				</Button>
			</div>
		</Modal>
	);
}
