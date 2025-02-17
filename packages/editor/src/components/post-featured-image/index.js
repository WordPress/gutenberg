/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import {
	DropZone,
	Button,
	Spinner,
	withNotices,
	withFilters,
	__experimentalHStack as HStack,
	Notice,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useState, useRef } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { useSelect, withDispatch, withSelect } from '@wordpress/data';
import {
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostFeaturedImageCheck from './check';
import { store as editorStore } from '../../store';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

// Used when labels from post type were not yet loaded or when they are not present.
const DEFAULT_FEATURE_IMAGE_LABEL = __( 'Featured image' );
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'Add a featured image' );

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

function PostFeaturedImage( {
	currentPostId,
	featuredImageId,
	onUpdateImage,
	onRemoveImage,
	media,
	postType,
	noticeUI,
	noticeOperations,
	isRequestingFeaturedImageMedia,
} ) {
	const returnsFocusRef = useRef( false );
	const [ isLoading, setIsLoading ] = useState( false );
	const { getSettings } = useSelect( blockEditorStore );
	const { mediaSourceUrl } = getMediaDetails( media, currentPostId );

	function onDropFiles( filesList ) {
		getSettings().mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList,
			onFileChange( [ image ] ) {
				if ( isBlobURL( image?.url ) ) {
					setIsLoading( true );
					return;
				}
				if ( image ) {
					onUpdateImage( image );
				}
				setIsLoading( false );
			},
			onError( message ) {
				noticeOperations.removeAllNotices();
				noticeOperations.createErrorNotice( message );
			},
			multiple: false,
		} );
	}

	/**
	 * Generates the featured image alt text for this editing context.
	 *
	 * @param {Object} imageMedia                               The image media object.
	 * @param {string} imageMedia.alt_text                      The alternative text of the image.
	 * @param {Object} imageMedia.media_details                 The media details of the image.
	 * @param {Object} imageMedia.media_details.sizes           The sizes of the image.
	 * @param {Object} imageMedia.media_details.sizes.full      The full size details of the image.
	 * @param {string} imageMedia.media_details.sizes.full.file The file name of the full size image.
	 * @param {string} imageMedia.slug                          The slug of the image.
	 * @return {string} The featured image alt text.
	 */
	function getImageDescription( imageMedia ) {
		if ( imageMedia.alt_text ) {
			return sprintf(
				// Translators: %s: The selected image alt text.
				__( 'Current image: %s' ),
				imageMedia.alt_text
			);
		}
		return sprintf(
			// Translators: %s: The selected image filename.
			__(
				'The current image has no alternative text. The file name is: %s'
			),
			imageMedia.media_details.sizes?.full?.file || imageMedia.slug
		);
	}

	function returnFocus( node ) {
		if ( returnsFocusRef.current && node ) {
			node.focus();
			returnsFocusRef.current = false;
		}
	}

	const isMissingMedia =
		! isRequestingFeaturedImageMedia && !! featuredImageId && ! media;

	return (
		<PostFeaturedImageCheck>
			{ noticeUI }
			<div className="editor-post-featured-image">
				{ media && (
					<div
						id={ `editor-post-featured-image-${ featuredImageId }-describedby` }
						className="hidden"
					>
						{ getImageDescription( media ) }
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
								{ isMissingMedia ? (
									<Notice
										status="warning"
										isDismissible={ false }
									>
										{ __(
											'Could not retrieve the featured image data.'
										) }
									</Notice>
								) : (
									<Button
										__next40pxDefaultSize
										ref={ returnFocus }
										className={
											! featuredImageId
												? 'editor-post-featured-image__toggle'
												: 'editor-post-featured-image__preview'
										}
										onClick={ open }
										aria-label={
											! featuredImageId
												? null
												: __(
														'Edit or replace the featured image'
												  )
										}
										aria-describedby={
											! featuredImageId
												? null
												: `editor-post-featured-image-${ featuredImageId }-describedby`
										}
										aria-haspopup="dialog"
										disabled={ isLoading }
										accessibleWhenDisabled
									>
										{ !! featuredImageId && media && (
											<img
												className="editor-post-featured-image__preview-image"
												src={ mediaSourceUrl }
												alt={ getImageDescription(
													media
												) }
											/>
										) }
										{ ( isLoading ||
											isRequestingFeaturedImageMedia ) && (
											<Spinner />
										) }
										{ ! featuredImageId &&
											! isLoading &&
											( postType?.labels
												?.set_featured_image ||
												DEFAULT_SET_FEATURE_IMAGE_LABEL ) }
									</Button>
								) }
								{ !! featuredImageId && (
									<HStack
										className={ clsx(
											'editor-post-featured-image__actions',
											{
												'editor-post-featured-image__actions-missing-image':
													isMissingMedia,
												'editor-post-featured-image__actions-is-requesting-image':
													isRequestingFeaturedImageMedia,
											}
										) }
									>
										<Button
											__next40pxDefaultSize
											className="editor-post-featured-image__action"
											onClick={ open }
											aria-haspopup="dialog"
											variant={
												isMissingMedia
													? 'secondary'
													: undefined
											}
										>
											{ __( 'Replace' ) }
										</Button>
										<Button
											__next40pxDefaultSize
											className="editor-post-featured-image__action"
											onClick={ () => {
												onRemoveImage();
												// Signal that the toggle button should be focused,
												// when it is rendered. Can't focus it directly here
												// because it's rendered conditionally.
												returnsFocusRef.current = true;
											} }
											variant={
												isMissingMedia
													? 'secondary'
													: undefined
											}
											isDestructive={ isMissingMedia }
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

const applyWithSelect = withSelect( ( select ) => {
	const { getMedia, getPostType, hasFinishedResolution } =
		select( coreStore );
	const { getCurrentPostId, getEditedPostAttribute } = select( editorStore );
	const featuredImageId = getEditedPostAttribute( 'featured_media' );

	return {
		media: featuredImageId
			? getMedia( featuredImageId, { context: 'view' } )
			: null,
		currentPostId: getCurrentPostId(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		featuredImageId,
		isRequestingFeaturedImageMedia:
			!! featuredImageId &&
			! hasFinishedResolution( 'getMedia', [
				featuredImageId,
				{ context: 'view' },
			] ),
	};
} );

const applyWithDispatch = withDispatch(
	( dispatch, { noticeOperations }, { select } ) => {
		const { editPost } = dispatch( editorStore );
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
						multiple: false,
					} );
			},
			onRemoveImage() {
				editPost( { featured_media: 0 } );
			},
		};
	}
);

/**
 * Renders the component for managing the featured image of a post.
 *
 * @param {Object}   props                  Props.
 * @param {number}   props.currentPostId    ID of the current post.
 * @param {number}   props.featuredImageId  ID of the featured image.
 * @param {Function} props.onUpdateImage    Function to call when the image is updated.
 * @param {Function} props.onRemoveImage    Function to call when the image is removed.
 * @param {Object}   props.media            The media object representing the featured image.
 * @param {string}   props.postType         Post type.
 * @param {Element}  props.noticeUI         UI for displaying notices.
 * @param {Object}   props.noticeOperations Operations for managing notices.
 *
 * @return {Element} Component to be rendered .
 */
export default compose(
	withNotices,
	applyWithSelect,
	applyWithDispatch,
	withFilters( 'editor.PostFeaturedImage' )
)( PostFeaturedImage );
