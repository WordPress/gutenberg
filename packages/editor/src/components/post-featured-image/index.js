/**
 * External dependencies
 */
import { has, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import {
	DropZone,
	Button,
	Spinner,
	ResponsiveWrapper,
	withNotices,
	withFilters,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostFeaturedImageCheck from './check';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

// Used when labels from post type were not yet loaded or when they are not present.
const DEFAULT_FEATURE_IMAGE_LABEL = __( 'Featured image' );
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'Set featured image' );
const DEFAULT_REMOVE_FEATURE_IMAGE_LABEL = __( 'Remove image' );

function PostFeaturedImage( {
	currentPostId,
	featuredImageId,
	onUpdateImage,
	onDropImage,
	onRemoveImage,
	media,
	postType,
	noticeUI,
} ) {
	const postLabel = get( postType, [ 'labels' ], {} );
	const instructions = (
		<p>
			{ __(
				'To edit the featured image, you need permission to upload media.'
			) }
		</p>
	);

	let mediaWidth, mediaHeight, mediaSourceUrl;
	if ( media ) {
		const mediaSize = applyFilters(
			'editor.PostFeaturedImage.imageSize',
			'post-thumbnail',
			media.id,
			currentPostId
		);
		if ( has( media, [ 'media_details', 'sizes', mediaSize ] ) ) {
			// use mediaSize when available
			mediaWidth = media.media_details.sizes[ mediaSize ].width;
			mediaHeight = media.media_details.sizes[ mediaSize ].height;
			mediaSourceUrl = media.media_details.sizes[ mediaSize ].source_url;
		} else {
			// get fallbackMediaSize if mediaSize is not available
			const fallbackMediaSize = applyFilters(
				'editor.PostFeaturedImage.imageSize',
				'thumbnail',
				media.id,
				currentPostId
			);
			if (
				has( media, [ 'media_details', 'sizes', fallbackMediaSize ] )
			) {
				// use fallbackMediaSize when mediaSize is not available
				mediaWidth =
					media.media_details.sizes[ fallbackMediaSize ].width;
				mediaHeight =
					media.media_details.sizes[ fallbackMediaSize ].height;
				mediaSourceUrl =
					media.media_details.sizes[ fallbackMediaSize ].source_url;
			} else {
				// use full image size when mediaFallbackSize and mediaSize are not available
				mediaWidth = media.media_details.width;
				mediaHeight = media.media_details.height;
				mediaSourceUrl = media.source_url;
			}
		}
	}

	return (
		<PostFeaturedImageCheck>
			{ noticeUI }
			<div className="editor-post-featured-image">
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
				<MediaUploadCheck fallback={ instructions }>
					<MediaUpload
						title={
							postLabel.featured_image ||
							DEFAULT_FEATURE_IMAGE_LABEL
						}
						onSelect={ onUpdateImage }
						unstableFeaturedImageFlow
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						modalClass="editor-post-featured-image__media-modal"
						render={ ( { open } ) => (
							<div className="editor-post-featured-image__container">
								<Button
									className={
										! featuredImageId
											? 'editor-post-featured-image__toggle'
											: 'editor-post-featured-image__preview'
									}
									onClick={ open }
									aria-label={
										! featuredImageId
											? null
											: __( 'Edit or update the image' )
									}
									aria-describedby={
										! featuredImageId
											? null
											: `editor-post-featured-image-${ featuredImageId }-describedby`
									}
								>
									{ !! featuredImageId && media && (
										<ResponsiveWrapper
											naturalWidth={ mediaWidth }
											naturalHeight={ mediaHeight }
											isInline
										>
											<img
												src={ mediaSourceUrl }
												alt=""
											/>
										</ResponsiveWrapper>
									) }
									{ !! featuredImageId && ! media && (
										<Spinner />
									) }
									{ ! featuredImageId &&
										( postLabel.set_featured_image ||
											DEFAULT_SET_FEATURE_IMAGE_LABEL ) }
								</Button>
								<DropZone onFilesDrop={ onDropImage } />
							</div>
						) }
						value={ featuredImageId }
					/>
				</MediaUploadCheck>
				{ !! featuredImageId && media && ! media.isLoading && (
					<MediaUploadCheck>
						<MediaUpload
							title={
								postLabel.featured_image ||
								DEFAULT_FEATURE_IMAGE_LABEL
							}
							onSelect={ onUpdateImage }
							unstableFeaturedImageFlow
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							modalClass="editor-post-featured-image__media-modal"
							render={ ( { open } ) => (
								<Button onClick={ open } variant="secondary">
									{ __( 'Replace Image' ) }
								</Button>
							) }
						/>
					</MediaUploadCheck>
				) }
				{ !! featuredImageId && (
					<MediaUploadCheck>
						<Button
							onClick={ onRemoveImage }
							variant="link"
							isDestructive
						>
							{ postLabel.remove_featured_image ||
								DEFAULT_REMOVE_FEATURE_IMAGE_LABEL }
						</Button>
					</MediaUploadCheck>
				) }
			</div>
		</PostFeaturedImageCheck>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getMedia, getPostType } = select( 'core' );
	const { getCurrentPostId, getEditedPostAttribute } = select(
		'core/editor'
	);
	const featuredImageId = getEditedPostAttribute( 'featured_media' );

	return {
		media: featuredImageId ? getMedia( featuredImageId ) : null,
		currentPostId: getCurrentPostId(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		featuredImageId,
	};
} );

const applyWithDispatch = withDispatch(
	( dispatch, { noticeOperations }, { select } ) => {
		const { editPost } = dispatch( 'core/editor' );
		return {
			onUpdateImage( image ) {
				editPost( { featured_media: image.id } );
			},
			onDropImage( filesList ) {
				select( blockEditorStore )
					.getSettings()
					.mediaUpload( {
						allowedTypes: [ 'image' ],
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
