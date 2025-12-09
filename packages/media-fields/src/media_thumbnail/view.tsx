/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalTruncate as Truncate,
	__experimentalVStack as VStack,
	Icon,
} from '@wordpress/components';
import type { Attachment } from '@wordpress/core-data';
import { getFilename } from '@wordpress/url';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import { getMediaTypeFromMimeType } from '../utils/get-media-type-from-mime-type';
import type { MediaItem } from '../types';

export default function MediaThumbnailView( {
	item,
	config,
}: DataViewRenderFieldProps< MediaItem > ) {
	const _featuredMedia = useSelect(
		( select ) => {
			// Avoid the network request if it's not needed. `featured_media` is
			// 0 for images and media without featured media.
			if ( ! item.featured_media ) {
				return;
			}
			return select( coreStore ).getEntityRecord< Attachment >(
				'postType',
				'attachment',
				item.featured_media
			);
		},
		[ item.featured_media ]
	);
	const featuredMedia = item.featured_media ? _featuredMedia : item;

	// Fetching.
	if ( ! featuredMedia ) {
		return null;
	}

	const filename = getFilename( featuredMedia.source_url || '' );

	if (
		// Ensure the featured media is an image.
		getMediaTypeFromMimeType( featuredMedia.mime_type ).type === 'image'
	) {
		return (
			<div className="dataviews-media-field__media-thumbnail">
				<img
					className="dataviews-media-field__media-thumbnail--image"
					src={ featuredMedia.source_url }
					srcSet={
						featuredMedia?.media_details?.sizes
							? (
									Object.values(
										featuredMedia.media_details.sizes
									) as Array< {
										source_url: string;
										width: number;
									} >
							   )
									.map(
										( size ) =>
											`${ size.source_url } ${ size.width }w`
									)
									.join( ', ' )
							: undefined
					}
					sizes={ config?.sizes || '100vw' }
					alt={ featuredMedia.alt_text || featuredMedia.title.raw }
				/>
			</div>
		);
	}

	return (
		<div className="dataviews-media-field__media-thumbnail">
			<VStack
				justify="center"
				alignment="center"
				className="dataviews-media-field__media-thumbnail__stack"
				spacing={ 0 }
			>
				<Icon
					className="dataviews-media-field__media-thumbnail--icon"
					icon={ getMediaTypeFromMimeType( item.mime_type ).icon }
					size={ 24 }
				/>
				{ !! filename && (
					<div className="dataviews-media-field__media-thumbnail__filename">
						<Truncate className="dataviews-media-field__media-thumbnail__filename__truncate">
							{ filename }
						</Truncate>
					</div>
				) }
			</VStack>
		</div>
	);
}
