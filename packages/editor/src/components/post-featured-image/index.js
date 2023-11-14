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
	withFilters,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useState, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import PostFeaturedImageCheck from './check';
import { store as editorStore } from '../../store';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

// Used when labels from post type were not yet loaded or when they are not present.
const DEFAULT_FEATURE_IMAGE_LABEL = __( 'Featured image' );
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'Set featured image' );

const instructions = (
	<p>
		{ __(
			'To edit the featured image, you need permission to upload media.'
		) }
	</p>
);

function getMediaDetails( media, postId ) {
	if ( ! media ) {
		return {};
	}

	const defaultSize = applyFilters(
		'editor.PostFeaturedImage.imageSize',
		'large',
		media.id,
		postId
	);
	if ( defaultSize in ( media?.media_details?.sizes ?? {} ) ) {
		return {
			mediaWidth: media.media_details.sizes[ defaultSize ].width,
			mediaHeight: media.media_details.sizes[ defaultSize ].height,
			mediaSourceUrl: media.media_details.sizes[ defaultSize ].source_url,
		};
	}

	// Use fallbackSize when defaultSize is not available.
	const fallbackSize = applyFilters(
		'editor.PostFeaturedImage.imageSize',
		'thumbnail',
		media.id,
		postId
	);
	if ( fallbackSize in ( media?.media_details?.sizes ?? {} ) ) {
		return {
			mediaWidth: media.media_details.sizes[ fallbackSize ].width,
			mediaHeight: media.media_details.sizes[ fallbackSize ].height,
			mediaSourceUrl:
				media.media_details.sizes[ fallbackSize ].source_url,
		};
	}

	// Use full image size when fallbackSize and defaultSize are not available.
	return {
		mediaWidth: media.media_details.width,
		mediaHeight: media.media_details.height,
		mediaSourceUrl: media.source_url,
	};
}

function PostFeaturedImage() {
	const toggleRef = useRef();
	const [ isLoading, setIsLoading ] = useState( false );
	const { mediaUpload, media, currentPostId, postType, featuredImageId } =
		useSelect( ( select ) => {
			const { mediaUpload: _mediaUpload } =
				select( blockEditorStore ).getSettings();
			const { getMedia, getPostType } = select( coreStore );
			const { getCurrentPostId, getEditedPostAttribute } =
				select( editorStore );
			const _featuredImageId = getEditedPostAttribute( 'featured_media' );

			return {
				mediaUpload: _mediaUpload,
				media: _featuredImageId
					? getMedia( featuredImageId, { context: 'view' } )
					: null,
				currentPostId: getCurrentPostId(),
				postType: getPostType( getEditedPostAttribute( 'type' ) ),
				featuredImageId: _featuredImageId,
			};
		}, [] );
	const { editPost } = useDispatch( editorStore );
	const { removeAllNotices, createErrorNotice } = useDispatch( noticesStore );
	const { mediaWidth, mediaHeight, mediaSourceUrl } = getMediaDetails(
		media,
		currentPostId
	);

	function onUpdateImage( image ) {
		if ( image?.id ) {
			editPost( { featured_media: image.id } );
		}
	}

	function onRemoveImage() {
		editPost( { featured_media: 0 } );
	}

	function onDropFiles( filesList ) {
		mediaUpload( {
			allowedTypes: [ 'image' ],
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
				removeAllNotices();
				createErrorNotice( message, { type: 'snackbar' } );
			},
		} );
	}

	return (
		<PostFeaturedImageCheck>
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
							postType?.labels?.featured_image ||
							DEFAULT_FEATURE_IMAGE_LABEL
						}
						onSelect={ onUpdateImage }
						unstableFeaturedImageFlow
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						modalClass="editor-post-featured-image__media-modal"
						render={ ( { open } ) => (
							<div className="editor-post-featured-image__container">
								<Button
									ref={ toggleRef }
									className={
										! featuredImageId
											? 'editor-post-featured-image__toggle'
											: 'editor-post-featured-image__preview'
									}
									onClick={ open }
									aria-label={
										! featuredImageId
											? null
											: __( 'Edit or replace the image' )
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
									{ isLoading && <Spinner /> }
									{ ! featuredImageId &&
										! isLoading &&
										( postType?.labels
											?.set_featured_image ||
											DEFAULT_SET_FEATURE_IMAGE_LABEL ) }
								</Button>
								{ !! featuredImageId && (
									<HStack className="editor-post-featured-image__actions">
										<Button
											className="editor-post-featured-image__action"
											onClick={ open }
											// Prefer that screen readers use the .editor-post-featured-image__preview button.
											aria-hidden="true"
										>
											{ __( 'Replace' ) }
										</Button>
										<Button
											className="editor-post-featured-image__action"
											onClick={ () => {
												onRemoveImage();
												toggleRef.current.focus();
											} }
										>
											{ __( 'Remove' ) }
										</Button>
									</HStack>
								) }
								<DropZone onFilesDrop={ onDropFiles } />
							</div>
						) }
						value={ featuredImageId }
					/>
				</MediaUploadCheck>
			</div>
		</PostFeaturedImageCheck>
	);
}

export default withFilters( 'editor.PostFeaturedImage' )( PostFeaturedImage );
