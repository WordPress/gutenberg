/**
 * External dependencies
 */
import { has, get } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import {
	DropZone,
	withNotices,
	withFilters,
	Dropdown,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useState } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { useSelect, withDispatch, withSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostFeaturedImageCheck from './check';
import PostFeaturedImageUploadProvider from './upload-provider';
import PostFeaturedImageToggle from './toggle';
import PostFeaturedImagePreview from './preview';
import PostFeaturedImageMenu from './menu';
import { store as editorStore } from '../../store';

const ALLOWED_MEDIA_TYPES = [ 'image' ];
const ALLOWED_UPLOAD_TYPES = 'image/*';

// Used when labels from post type were not yet loaded or when they are not present.
const DEFAULT_FEATURE_IMAGE_LABEL = __( 'Featured image' );
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'Set featured image' );
const DEFAULT_REMOVE_FEATURE_IMAGE_LABEL = __( 'Remove image' );

const instructions = (
	<p>
		{ __(
			'To edit the featured image, you need permission to upload media.'
		) }
	</p>
);

function getMediaDetails( media, postId ) {
	if ( ! media ) {
		return null;
	}

	const defaultSize = applyFilters(
		'editor.PostFeaturedImage.imageSize',
		'large',
		media.id,
		postId
	);
	if ( has( media, [ 'media_details', 'sizes', defaultSize ] ) ) {
		return {
			width: media.media_details.sizes[ defaultSize ].width,
			height: media.media_details.sizes[ defaultSize ].height,
			sourceUrl: media.media_details.sizes[ defaultSize ].source_url,
		};
	}

	// Use fallbackSize when defaultSize is not available.
	const fallbackSize = applyFilters(
		'editor.PostFeaturedImage.imageSize',
		'thumbnail',
		media.id,
		postId
	);
	if ( has( media, [ 'media_details', 'sizes', fallbackSize ] ) ) {
		return {
			width: media.media_details.sizes[ fallbackSize ].width,
			height: media.media_details.sizes[ fallbackSize ].height,
			sourceUrl: media.media_details.sizes[ fallbackSize ].source_url,
		};
	}

	// Use full image size when fallbackSize and defaultSize are not available.
	return {
		width: media.media_details.width,
		height: media.media_details.height,
		sourceUrl: media.source_url,
	};
}

function PostFeaturedImage( {
	className,
	currentPostId,
	featuredImageId,
	onUpdateImage,
	onRemoveImage,
	media,
	postType,
	noticeUI,
	noticeOperations,
} ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const mediaUpload = useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings().mediaUpload;
	}, [] );
	const postLabel = get( postType, [ 'labels' ], {} );
	const mediaDetails = getMediaDetails( media, currentPostId );

	function processUpload( filesList ) {
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList,
			onFileChange( [ image ] ) {
				if ( isBlobURL( image?.url ) ) {
					setIsLoading( true );
					return;
				}
				onUpdateImage( image );
				setIsLoading( false );
			},
			onError( message ) {
				noticeOperations.removeAllNotices();
				noticeOperations.createErrorNotice( message );
			},
		} );
	}

	return (
		<PostFeaturedImageCheck>
			{ noticeUI }
			<div
				className={ classnames(
					'editor-post-featured-image',
					className
				) }
			>
				{ media && (
					<div
						id={ `editor-post-featured-image-${ featuredImageId }-describedby` }
						className="hidden"
					>
						{ media.alt_text &&
							sprintf(
								// Translators: %s: The selected image alt text.
								__( 'Current image: %s' ),
								media.alt_text
							) }
						{ ! media.alt_text &&
							sprintf(
								// Translators: %s: The selected image filename.
								__(
									'The current image has no alternative text. The file name is: %s'
								),
								media.media_details.sizes?.full?.file ||
									media.slug
							) }
					</div>
				) }
				<PostFeaturedImageUploadProvider
					fallback={ instructions }
					title={
						postLabel.featured_image || DEFAULT_FEATURE_IMAGE_LABEL
					}
					selectedId={ featuredImageId }
					allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
					allowedUploadTypes={ ALLOWED_UPLOAD_TYPES }
					onSelect={ onUpdateImage }
					onUpload={ processUpload }
				>
					{ ( { openMediaLibrary, openFileDialog } ) => (
						<div className="editor-post-featured-image__container">
							<Dropdown
								className="editor-post-featured-image__dropdown"
								position="center left"
								renderToggle={ ( { isOpen, onToggle } ) =>
									featuredImageId ? (
										<PostFeaturedImagePreview
											mediaDetails={ mediaDetails }
											isLoading={ isLoading }
											aria-expanded={ isOpen }
											aria-describedby={ `editor-post-featured-image-${ featuredImageId }-describedby` }
											onClick={ onToggle }
										/>
									) : (
										<PostFeaturedImageToggle
											aria-expanded={ isOpen }
											onClick={ onToggle }
										>
											{ postLabel.set_featured_image ||
												DEFAULT_SET_FEATURE_IMAGE_LABEL }
										</PostFeaturedImageToggle>
									)
								}
								renderContent={ ( { onClose } ) => (
									<PostFeaturedImageMenu
										title={
											postLabel.featured_image ||
											DEFAULT_FEATURE_IMAGE_LABEL
										}
										removeImageLabel={
											postLabel.remove_featured_image ||
											DEFAULT_REMOVE_FEATURE_IMAGE_LABEL
										}
										onClose={ onClose }
										onOpenMediaLibrary={ openMediaLibrary }
										onOpenFileDialog={ openFileDialog }
										onRemoveImage={
											featuredImageId
												? onRemoveImage
												: null
										}
									/>
								) }
							/>
							<DropZone onFilesDrop={ processUpload } />
						</div>
					) }
				</PostFeaturedImageUploadProvider>
			</div>
		</PostFeaturedImageCheck>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getMedia, getPostType } = select( coreStore );
	const { getCurrentPostId, getEditedPostAttribute } = select( editorStore );
	const featuredImageId = getEditedPostAttribute( 'featured_media' );

	return {
		media: featuredImageId
			? getMedia( featuredImageId, { context: 'view' } )
			: null,
		currentPostId: getCurrentPostId(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		featuredImageId,
	};
} );

const applyWithDispatch = withDispatch(
	( dispatch, { noticeOperations }, { select } ) => {
		const { editPost } = dispatch( editorStore );
		return {
			onUpdateImage( image ) {
				editPost( { featured_media: image.id } );
			},
			// todo: this is dead code, but I suppose we can't remove it because of the filter?
			onDropImage( filesList ) {
				select( blockEditorStore )
					.getSettings()
					.mediaUpload( {
						allowedTypes: ALLOWED_MEDIA_TYPES,
						filesList,
						onFileChange( [ image ] ) {
							editPost( { featured_media: image.id } );
						},
						onError( message ) {
							noticeOperations.removeAllNotices();
							noticeOperations.createErrorNotice( message );
						},
					} );
			},
			onRemoveImage() {
				editPost( { featured_media: 0 } );
			},
		};
	}
);

export default compose(
	withNotices,
	applyWithSelect,
	applyWithDispatch,
	withFilters( 'editor.PostFeaturedImage' )
)( PostFeaturedImage );
