/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';
import { MediaCategoryPanel } from './media-panel';
import { useMediaCategories } from './hooks';
import InserterContentNavigator from '../inserter-content-navigator';
import InserterNoResults from '../no-results';
import { getBlockAndPreviewFromMedia } from './utils';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

function MediaTab( { rootClientId, onInsert } ) {
	const mediaCategories = useMediaCategories( rootClientId );
	const categories = useMemo(
		() =>
			mediaCategories.map( ( mediaCategory ) => ( {
				...mediaCategory,
				label: mediaCategory.labels.name,
			} ) ),
		[ mediaCategories ]
	);
	const baseCssClass = 'block-editor-inserter__media-tabs';
	const onSelectMedia = useCallback(
		( media ) => {
			if ( ! media?.url ) {
				return;
			}
			const [ block ] = getBlockAndPreviewFromMedia( media, media.type );
			onInsert( block );
		},
		[ onInsert ]
	);

	if ( ! categories.length ) {
		return <InserterNoResults />;
	}

	return (
		<>
			<InserterContentNavigator
				className={ baseCssClass }
				categories={ categories }
			>
				{ ( category ) => (
					<MediaCategoryPanel
						onInsert={ onInsert }
						rootClientId={ rootClientId }
						category={ category }
					/>
				) }
			</InserterContentNavigator>
			<MediaUploadCheck>
				<MediaUpload
					multiple={ false }
					onSelect={ onSelectMedia }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					render={ ( { open } ) => (
						<Button
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
		</>
	);
}

export default MediaTab;
