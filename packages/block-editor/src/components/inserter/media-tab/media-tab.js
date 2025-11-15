/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MediaCategoryPanel } from './media-panel';
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';
import MediaUploadModal from '../../media-upload-modal';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import MobileTabNavigation from '../mobile-tab-navigation';
import CategoryTabs from '../category-tabs';
import InserterNoResults from '../no-results';
import { store as blockEditorStore } from '../../../store';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

/**
 * Conditional Media component that uses MediaUploadModal when experiment is enabled,
 * otherwise falls back to MediaUpload.
 *
 * @param {Object}   root0        Component props.
 * @param {Function} root0.render Render prop function that receives { open } object.
 * @return {JSX.Element} The component.
 */
function ConditionalMediaUpload( { render, ...props } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const mediaUpload = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().mediaUpload;
	}, [] );

	if ( window.__experimentalDataViewsMediaModal ) {
		return (
			<>
				{ render && render( { open: () => setIsModalOpen( true ) } ) }
				<MediaUploadModal
					{ ...props }
					isOpen={ isModalOpen }
					onClose={ () => {
						setIsModalOpen( false );
						props.onClose?.();
					} }
					onSelect={ ( media ) => {
						setIsModalOpen( false );
						props.onSelect?.( media );
					} }
					onUpload={ mediaUpload }
				/>
			</>
		);
	}

	return <MediaUpload { ...props } render={ render } />;
}

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
						<ConditionalMediaUpload
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
