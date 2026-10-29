import clsx from 'clsx';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { audio, file, image, video } from '@wordpress/icons';
import { Icon, Stack, Text } from '@wordpress/ui';
import { getFilename } from '@wordpress/url';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import type { MediaItem } from '../types';
import styles from './style.module.css';

/*
 * A copy of the thumbnail view of `@wordpress/media-fields`, laid out with
 * `Stack`, `Icon`, and `Text` instead of the `VStack`, `Icon`, and `Truncate`
 * of `@wordpress/components`, and styled with a CSS module.
 */

/**
 * The icon of a media type, from its MIME type.
 *
 * @param mimeType The MIME type of the media.
 */
function getMediaTypeIcon( mimeType: string ) {
	if ( mimeType.startsWith( 'image/' ) ) {
		return image;
	}
	if ( mimeType.startsWith( 'video/' ) ) {
		return video;
	}
	if ( mimeType.startsWith( 'audio/' ) ) {
		return audio;
	}
	return file;
}

/**
 * Given the available image sizes and a target display width, returns the URL
 * of the smallest size whose width is >= the target. Falls back to the largest
 * available size, or the original source_url.
 *
 * @param media       The media item with size details.
 * @param configSizes The target display size string (e.g. '900px').
 */
export function getBestImageUrl(
	media: MediaItem,
	configSizes?: string
): string | undefined {
	const sizes = media?.media_details?.sizes;
	if ( ! sizes ) {
		return media.source_url;
	}

	// Parse target width from config.sizes (e.g. '900px' → 900).
	const targetWidth = configSizes ? parseInt( configSizes, 10 ) : NaN;
	if ( Number.isNaN( targetWidth ) ) {
		return media.source_url;
	}

	// Sort the entries that have a valid numeric width, ascending by width.
	const sorted = Object.values( sizes )
		.filter(
			( size ): size is typeof size & { width: number } =>
				typeof size.width === 'number' && ! Number.isNaN( size.width )
		)
		.toSorted( ( a, b ) => a.width - b.width );
	if ( ! sorted.length ) {
		return media.source_url;
	}

	// Pick the smallest size that is >= target width, or the largest one
	// when none is large enough.
	const match =
		sorted.find( ( size ) => size.width >= targetWidth ) ??
		sorted[ sorted.length - 1 ];
	return match.source_url;
}

function FallbackView( {
	item,
	filename,
}: {
	item: MediaItem;
	filename: string;
} ) {
	return (
		<div className={ styles.thumbnail }>
			<Stack
				direction="column"
				justify="center"
				align="center"
				className={ styles.stack }
			>
				<Icon
					className={ styles.icon }
					icon={ getMediaTypeIcon( item.mime_type || '' ) }
					size={ 24 }
				/>
				{ !! filename && (
					<div className={ styles.filename }>
						<Text
							variant="body-sm"
							className={ styles[ 'filename-text' ] }
						>
							{ filename }
						</Text>
					</div>
				) }
			</Stack>
		</div>
	);
}

function ImageView( {
	item,
	configSizes,
	onError,
}: {
	item: MediaItem;
	configSizes?: string;
	onError: () => void;
} ) {
	const imageUrl = getBestImageUrl( item, configSizes );
	const title = typeof item.title === 'string' ? item.title : item.title?.raw;

	/*
	 * Use three states to avoid fade-in animation for cached images:
	 * 'instant' = image already cached, 'loading' = waiting, 'loaded' = just finished.
	 */
	const [ loadingState, setLoadingState ] = useState<
		'instant' | 'loading' | 'loaded'
	>( 'loading' );

	useEffect( () => {
		setLoadingState( 'loading' );
	}, [ imageUrl ] );

	const imgRef = useCallback( ( img: HTMLImageElement | null ) => {
		if ( img?.complete ) {
			setLoadingState( 'instant' );
		}
	}, [] );

	const handleLoad = () => {
		if ( loadingState === 'loading' ) {
			setLoadingState( 'loaded' );
		}
	};

	return (
		<div
			className={ clsx( styles.thumbnail, {
				[ styles[ 'is-loading' ] ]: loadingState === 'loading',
				[ styles[ 'is-loaded' ] ]: loadingState === 'loaded',
			} ) }
		>
			<img
				ref={ imgRef }
				className={ styles.image }
				src={ imageUrl }
				alt={ item.alt_text || title }
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
}: Pick< DataViewRenderFieldProps< MediaItem >, 'item' | 'config' > ) {
	const [ imageError, setImageError ] = useState( false );

	const _featuredMedia = useSelect(
		( select ) => {
			// Avoid the network request if it's not needed. `featured_media` is
			// 0 for images and media without featured media.
			if ( ! item.featured_media ) {
				return;
			}
			return select( coreStore ).getEntityRecord< MediaItem >(
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
		! ( featuredMedia.mime_type || '' ).startsWith( 'image/' )
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
