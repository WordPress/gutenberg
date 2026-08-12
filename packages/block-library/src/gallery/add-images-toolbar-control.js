import {
	BlockControls,
	MediaReplaceFlow,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ALLOWED_MEDIA_TYPES } from './constants';
import useUpdateImages from './use-update-images';

/**
 * The gallery's "Add" toolbar control.
 *
 * Rendered both by the gallery itself and by a selected child image block, so
 * an image can be added without first having to select the gallery. See
 * https://github.com/WordPress/gutenberg/issues/47200.
 *
 * It sits in the `other` group rather than being shared through the
 * `__experimentalExposeControlsToChildren` support, which would also share the
 * gallery's alignment control — duplicating the image block's own — and move
 * the selected image's whole toolbar to the top of the gallery.
 *
 * @param {Object} props
 * @param {string} props.clientId Client ID of the gallery block.
 */
export default function AddImagesToolbarControl( { clientId } ) {
	const updateImages = useUpdateImages( clientId );

	const { canAddImages, mediaIds } = useSelect(
		( select ) => {
			const { getBlock, canInsertBlockType } = select( blockEditorStore );

			return {
				// The same check the inserter makes, so the control is hidden
				// wherever an image could not actually be added: a template
				// lock on the gallery, a disabled editing mode, a section or
				// synced pattern ancestor, an `allowedBlocks` restriction (as
				// dynamic galleries set), or preview mode.
				canAddImages: canInsertBlockType( 'core/image', clientId ),
				mediaIds: ( getBlock( clientId )?.innerBlocks ?? [] )
					.map( ( block ) => block.attributes.id )
					.filter( ( id ) => !! id ),
			};
		},
		[ clientId ]
	);

	if ( ! canAddImages ) {
		return null;
	}

	return (
		<BlockControls group="other">
			<MediaReplaceFlow
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				handleUpload={ false }
				onSelect={ updateImages }
				name={ __( 'Add' ) }
				multiple
				mediaIds={ mediaIds }
				addToGallery={ mediaIds.length > 0 }
				variant="toolbar"
			/>
		</BlockControls>
	);
}
