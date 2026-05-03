/**
 * External dependencies
 */
import clsx from 'clsx';

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
import { useState, useRef, useLayoutEffect } from '@wordpress/element';
import type { Attachment } from '@wordpress/core-data';
import { getFilename } from '@wordpress/url';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import { getMediaTypeFromMimeType } from '../utils/get-media-type-from-mime-type';
import type { MediaItem } from '../types';

/**
 * Given the available image sizes and a target display width, returns the URL
 * of the smallest size whose width is >= the target. Falls back to the largest
 * available size, or the original source_url.
 *
 * @param featuredMedia The media item with size details.
 * @param configSizes   The target display size string (e.g. '900px').
 */
export function getBestImageUrl(
	featuredMedia: Attachment | MediaItem,
	configSizes?: string
): string {
	const sizes = featuredMedia?.media_details?.sizes;
	if ( ! sizes ) {
		return featuredMedia.source_url;
	}

	const sizeEntries = Object.values( sizes );

	if ( ! sizeEntries.length ) {
		return featuredMedia.source_url;
	}

	// Parse target width from config.sizes (e.g. '900px' → 900).
	const targetWidth = configSizes ? parseInt( configSizes, 10 ) : NaN;

	if ( ! Number.isNaN( targetWidth ) ) {
		// Filter to entries that have a valid numeric width.
		const validEntries = sizeEntries.filter(
			( s ) => typeof s.width === 'number' && ! Number.isNaN( s.width )
		);

		if ( ! validEntries.length ) {
			return featuredMedia.source_url;
		}

		// Sort ascending by width.
		const sorted = [ ...validEntries ].sort(
			( a, b ) => a.width - b.width
		);
		// Pick the smallest size that is >= target width.
		const match = sorted.find( ( s ) => s.width >= targetWidth );
		if ( match ) {
			return match.source_url;
		}
		// No size large enough — use the largest available.
		return sorted[ sorted.length - 1 ].source_url;
	}

	// If we can't parse the target, fall back to source_url.
	return featuredMedia.source_url;
}

function FallbackView( {
	item,
	filename,
}: {
	item: MediaItem;
	filename: string;
} ) {
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

function ImageView( {
	item,
	configSizes,
	onError,
}: {
	item: Attachment | MediaItem;
	configSizes?: string;
	onError: () => void;
} ) {
	const imageUrl = getBestImageUrl( item, configSizes );

	/*
	 * Use three states to avoid fade-in animation for cached images:
	 * 'instant' = image already cached, 'loading' = waiting, 'loaded' = just finished.
	 *
	 * useLayoutEffect runs synchronously after DOM mutations but before paint,
	 * so we can check img.complete to detect disk-cached images and skip the
	 * fade-in animation entirely.
	 */
	const imgRef = useRef< HTMLImageElement >( null );
	const [ loadingState, setLoadingState ] = useState<
		'instant' | 'loading' | 'loaded'
	>( 'loading' );

	useLayoutEffect( () => {
		if ( imgRef.current?.complete ) {
			setLoadingState( 'instant' );
		} else {
			setLoadingState( 'loading' );
		}
	}, [ imageUrl ] );

	const handleLoad = () => {
		if ( loadingState === 'loading' ) {
			setLoadingState( 'loaded' );
		}
	};

	return (
		<div
			className={ clsx( 'dataviews-media-field__media-thumbnail', {
				'is-loading': loadingState === 'loading',
				'is-loaded': loadingState === 'loaded',
			} ) }
		>
			<img
				ref={ imgRef }
				className="dataviews-media-field__media-thumbnail--image"
				src={ imageUrl }
				alt={ item.alt_text || item.title.raw }
				onLoad={ handleLoad }
				onError={ onError }
				loading="lazy"
			/>
		</div>
	);
}

export default function MediaThumbnailView( {
	item,
	config,
}: DataViewRenderFieldProps< MediaItem > ) {
	const [ imageError, setImageError ] = useState( false );

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

	// Show fallback if image failed to load or if not an image type.
	if (
		imageError ||
		getMediaTypeFromMimeType( featuredMedia.mime_type ).type !== 'image'
	) {
		return (
			<FallbackView item={ featuredMedia } filename={ filename || '' } />
		);
	}

	return (
		<ImageView
			item={ featuredMedia }
			configSizes={ config?.sizes }
			onError={ () => setImageError( true ) }
		/>
	);
}
