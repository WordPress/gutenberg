import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import MediaSources from './media-sources';
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
		<MediaSources
			categories={ categories }
			onInsert={ onInsert }
			footer={
				<MediaUploadCheck>
					<MediaUpload
						multiple={ false }
						onSelect={ onSelectMedia }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						render={ ( { open } ) => (
							<Button
								__next40pxDefaultSize
								onClick={ ( event ) => {
									// Safari doesn't emit a focus event on button elements when
									// clicked and we need to manually focus the button here.
									// The reason is that core's Media Library modal explicitly triggers a
									// focus event and therefore a `blur` event is triggered on a different
									// element, which doesn't contain the `data-unstable-ignore-focus-outside-for-relatedtarget`
									// attribute making the Inserter dialog to close.
									event.target.focus();
									open();
								} }
								className="block-editor-inserter__media-library-button"
								variant="secondary"
								data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
							>
								{ __( 'Open Media Library' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			}
		/>
	);
}

export default MediaTab;
