import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import MediaBrowser from './media-browser';
import MediaLibraryButton from './media-library-button';
import InserterNoResults from '../no-results';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

function MediaTab( { rootClientId, onInsert } ) {
	const mediaCategories = useMediaCategories( rootClientId );
	const onSelectMedia = useCallback(
		( media ) => {
			if ( ! media?.url ) {
				return;
			}
			// When the experimental DataViews media modal is enabled,
			// we need to extract the media type from mime_type (e.g., 'image/jpeg' -> 'image')
			const mediaType =
				window.__experimentalDataViewsMediaModal && media.mime_type
					? media.mime_type.split( '/' )[ 0 ]
					: media.type;
			const [ block ] = getBlockAndPreviewFromMedia( media, mediaType );
			onInsert( block );
		},
		[ onInsert ]
	);
	const categories = useMemo(
		() =>
			mediaCategories.map( ( mediaCategory ) => ( {
				...mediaCategory,
				label: mediaCategory.labels.name,
			} ) ),
		[ mediaCategories ]
	);

	if ( ! categories.length ) {
		return <InserterNoResults />;
	}

	return (
		<MediaBrowser
			categories={ categories }
			onInsert={ onInsert }
			footer={
				<MediaLibraryButton
					label={ __( 'Open Media Library' ) }
					onSelect={ onSelectMedia }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
				/>
			}
		/>
	);
}

export default MediaTab;
