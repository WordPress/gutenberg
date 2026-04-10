/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MediaCategoryPanel } from './media-panel';
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import MobileTabNavigation from '../mobile-tab-navigation';
import CategoryTabs from '../category-tabs';
import InserterNoResults from '../no-results';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

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

	const InserterMediaPanel = useSelect( ( select ) => {
		return unlock( select( blockEditorStore ) ).getInserterMediaPanel();
	}, [] );

	const onSelectMedia = useCallback(
		( media ) => {
			if ( ! media?.url ) {
				return;
			}
			const mediaType = media.mime_type
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

	// If the DataViews-based media panel is available, render it
	// instead of the category tabs.
	if ( InserterMediaPanel ) {
		return (
			<div className={ `${ baseCssClass }-container` }>
				<InserterMediaPanel
					rootClientId={ rootClientId }
					onInsert={ onInsert }
				/>
				<div className="block-editor-inserter__media-library-button-container">
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
				</div>
			</div>
		);
	}

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
				</div>
			) }
			{ isMobile && (
				<MobileTabNavigation categories={ categories }>
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
