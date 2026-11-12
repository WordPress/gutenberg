import { useEvent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import type { Block } from '@wordpress/blocks';

type ImageAttributes = Block[ 'attributes' ];

/**
 * Applies the gallery settings to images added to the gallery.
 *
 * An image block uploads its own file and sets its own size and link, so the
 * gallery settings can only be applied once the attachment loads.
 *
 * @param images               The gallery's image blocks.
 * @param mediaById            The loaded attachments, by id.
 * @param buildImageAttributes Returns the attributes to set on an image block.
 */
export default function useApplyGallerySettings(
	images: Block[],
	mediaById: ReadonlyMap< unknown, unknown >,
	buildImageAttributes: ( attributes: ImageAttributes ) => ImageAttributes
) {
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const handledImagesRef = useRef( new Set< string >() );

	const applyGallerySettings = useEvent( ( blocks: Block[] ) => {
		const changedAttributes = Object.fromEntries(
			blocks.map( ( block ) => [
				block.clientId,
				{
					...buildImageAttributes( block.attributes ),
					id: block.attributes.id,
					align: undefined,
				},
			] )
		);
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes(
			blocks.map( ( block ) => block.clientId ),
			changedAttributes,
			{ uniqueByBlock: true }
		);
	} );

	useEffect( () => {
		const handledImages = handledImagesRef.current;
		// A block keeps its client ID when it moves to another gallery or is
		// restored by undo, so it gets the settings again when it comes back.
		const clientIds = new Set( images.map( ( block ) => block.clientId ) );
		handledImages.forEach( ( clientId ) => {
			if ( ! clientIds.has( clientId ) ) {
				handledImages.delete( clientId );
			}
		} );

		const newImages: Block[] = [];
		images.forEach( ( block ) => {
			if ( handledImages.has( block.clientId ) ) {
				return;
			}
			if ( block.originalContent ) {
				handledImages.add( block.clientId );
				return;
			}
			if ( ! mediaById.has( block.attributes.id ) ) {
				return;
			}
			handledImages.add( block.clientId );
			newImages.push( block );
		} );
		if ( newImages.length > 0 ) {
			applyGallerySettings( newImages );
		}
	}, [ images, mediaById, applyGallerySettings ] );
}
