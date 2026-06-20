/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { video as videoIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Builds the URL of a companion file stored next to the attachment's original.
 *
 * @param {string} sourceUrl Attachment source URL.
 * @param {string} basename  Companion file basename.
 *
 * @return {string} Absolute companion URL.
 */
function companionUrl( sourceUrl, basename ) {
	const dir = sourceUrl.slice( 0, sourceUrl.lastIndexOf( '/' ) + 1 );
	return dir + basename;
}

/**
 * Toolbar control that toggles a video block between the web-safe transcoded
 * companion and the original upload.
 *
 * When a non-web-safe video is uploaded through the editor it is transcoded to
 * a web-safe companion that the block plays by default, while the original
 * stays the underlying attachment. This control lets the author switch the
 * block's `src` to the original (e.g. to reference the untouched upload) and
 * back to the optimized version.
 *
 * It only renders when the block's media is a video attachment that has an
 * `optimized_video` companion, so it never appears on videos that were not
 * transcoded.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.attributes    Video block attributes.
 * @param {Function} props.setAttributes Block attribute setter.
 *
 * @return {Component|null} The control, or null when no companion applies.
 */
export default function VideoOriginalControl( { attributes, setAttributes } ) {
	const { id, src } = attributes;

	const video = useSelect(
		( select ) => {
			if ( ! id ) {
				return null;
			}
			const record = select( coreStore ).getEntityRecord(
				'postType',
				'attachment',
				id,
				{ context: 'view' }
			);
			if ( ! record?.mime_type?.startsWith( 'video/' ) ) {
				return null;
			}
			if ( ! record?.media_details?.optimized_video ) {
				return null;
			}
			return record;
		},
		[ id ]
	);

	if ( ! video?.source_url ) {
		return null;
	}

	const originalUrl = video.source_url;
	const optimizedUrl = companionUrl(
		originalUrl,
		video.media_details.optimized_video
	);
	const isOptimized = src === optimizedUrl;

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					icon={ videoIcon }
					onClick={ () =>
						setAttributes( {
							src: isOptimized ? originalUrl : optimizedUrl,
						} )
					}
				>
					{ isOptimized
						? __( 'Use original video' )
						: __( 'Use optimized video' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
