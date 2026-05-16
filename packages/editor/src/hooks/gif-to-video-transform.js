/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { useEntityRecord } from '@wordpress/core-data';

/**
 * When an animated GIF is uploaded with client-side GIF-to-video conversion
 * enabled (see `@wordpress/upload-media`), the resulting attachment is a video
 * (MP4/WebM) even though the originating block is a `core/image` block. This
 * component watches the block's attachment record and, once it resolves to a
 * video, swaps the image block for a `core/video` block configured to behave
 * like the original GIF (muted, looping, autoplaying, inline).
 *
 * @param {Object} props            Block props.
 * @param {string} props.clientId   Block client ID.
 * @param {Object} props.attributes Block attributes.
 * @return {null} This component renders nothing.
 */
function GifToVideoTransform( { clientId, attributes } ) {
	const { id, url, caption } = attributes;

	const { record: attachment } = useEntityRecord(
		'postType',
		'attachment',
		id
	);

	const isVideo = attachment?.mime_type?.startsWith( 'video/' );

	const { replaceBlocks } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( ! isVideo ) {
			return;
		}

		void replaceBlocks(
			clientId,
			createBlock( 'core/video', {
				id,
				src: url,
				caption,
				controls: false,
				loop: true,
				autoplay: true,
				muted: true,
				playsInline: true,
			} )
		);
	}, [ id, isVideo, clientId, caption, url, replaceBlocks ] );

	return null;
}

/**
 * Higher-order component that transforms a `core/image` block into a
 * `core/video` block when its attachment is a video produced by the
 * client-side animated GIF to video conversion.
 */
const withGifToVideoTransform = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isImageWithAttachment =
			props.name === 'core/image' && Boolean( props.attributes?.id );

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ isImageWithAttachment && (
					<GifToVideoTransform { ...props } />
				) }
			</>
		);
	},
	'withGifToVideoTransform'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/with-gif-to-video-transform',
	withGifToVideoTransform
);
