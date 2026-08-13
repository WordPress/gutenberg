import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { MediaCategoryPanel } from './media-panel';
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import AddFolderButton from './add-folder-button';
import MobileTabNavigation from '../mobile-tab-navigation';
import CategoryTabs from '../category-tabs';
import InserterNoResults from '../no-results';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

function MediaTab( {
	rootClientId,
	selectedCategory,
	onSelectCategory,
	onInsert,
	children,
} ) {
	const mediaCategories = useMediaCategories( rootClientId );
	const isMobile = useViewportMatch( 'medium', '<' );
	const baseCssClass = 'block-editor-inserter__media-tabs';
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
	useEffect( () => {
		if ( ! selectedCategory ) {
			return;
		}

		const latestCategory = categories.find(
			( category ) => category.name === selectedCategory.name
		);

		if ( latestCategory && latestCategory !== selectedCategory ) {
			onSelectCategory( latestCategory );
		} else if ( ! latestCategory ) {
			onSelectCategory( null );
		}
	}, [ categories, onSelectCategory, selectedCategory ] );

	// A folder's category isn't available the moment the folder is created — it
	// appears once the term list resolves again and the categories are re-derived.
	// So the id is parked here and the category is selected when it turns up,
	// putting the user straight into the empty folder they just made, next to its
	// "Add images to folder" button.
	const [ pendingFolderId, setPendingFolderId ] = useState();
	useEffect( () => {
		if ( pendingFolderId === undefined ) {
			return;
		}
		const folderCategory = categories.find(
			( category ) => category.folderId === pendingFolderId
		);
		if ( folderCategory ) {
			setPendingFolderId( undefined );
			onSelectCategory( folderCategory );
		}
	}, [ categories, pendingFolderId, onSelectCategory ] );

	if ( ! categories.length ) {
		return <InserterNoResults />;
	}

	return (
		<>
			{ ! isMobile && (
				<div className={ `${ baseCssClass }-container` }>
					<CategoryTabs
						categories={ categories }
						selectedCategory={ selectedCategory }
						onSelectCategory={ onSelectCategory }
					>
						{ children }
					</CategoryTabs>
					{ /*
					 * The container distributes space between the tab list and
					 * this footer, so the buttons share a single stack rather
					 * than each becoming a distributed child.
					 */ }
					<Stack
						direction="column"
						gap="sm"
						className="block-editor-inserter__media-tabs-footer"
					>
						<AddFolderButton
							onCreate={ ( folder ) =>
								setPendingFolderId( folder?.id )
							}
						/>
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
					</Stack>
				</div>
			) }
			{ isMobile && (
				<MobileTabNavigation
					categories={ categories }
					screenClassName="block-editor-inserter__media-mobile-screen"
				>
					{ ( category ) => (
						<MediaCategoryPanel
							onInsert={ onInsert }
							rootClientId={ rootClientId }
							category={ category }
						/>
					) }
				</MobileTabNavigation>
			) }
		</>
	);
}

export default MediaTab;
