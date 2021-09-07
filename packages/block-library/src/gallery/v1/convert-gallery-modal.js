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

export const convertGallery = ( {
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

export default function ConvertGalleryModal( { onClose, clientId } ) {
	const { getBlock } = useSelect( blockEditorStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	return (
		<Modal
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
			title={ __( 'Convert to new gallery format' ) }
			className={ 'wp-block-convert-gallery-modal' }
			aria={ {
				describedby: 'wp-block-convert-gallery-modal__description',
			} }
		>
			<p id={ 'wp-block-convert-gallery-modal__description' }>
				{ __(
					'You can convert this gallery block to a new format which provides more flexibility, like adding custom links, or custom styles, to individual images.'
				) }
			</p>
			<p id={ 'wp-block-convert-gallery-modal__description' }>
				{ __(
					'There is no option to convert it back to the old format, so if you do not like the new format once converted just leave the post/page without saving.'
				) }
			</p>
			<div className="wp-block-convert-gallery-modal-buttons">
				<Button isTertiary onClick={ onClose }>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					isPrimary
					onClick={ convertGallery( {
						replaceBlocks,
						getBlock,
						clientId,
						createBlock,
					} ) }
				>
					{ __( 'Convert' ) }
				</Button>
			</div>
		</Modal>
	);
}
