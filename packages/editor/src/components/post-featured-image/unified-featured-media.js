/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, BaseControl, Spinner } from '@wordpress/components';
import { useId } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Stack } from '@wordpress/ui';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { getMediaType } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

export default function UnifiedFeaturedMedia() {
	const instanceId = useId();
	const { meta, featuredImageId } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		return {
			meta: getEditedPostAttribute( 'meta' ) || {},
			featuredImageId: getEditedPostAttribute( 'featured_media' ) || 0,
		};
	}, [] );

	const featuredMediaId = meta._featured_media_id || 0;
	const featuredMediaType = meta._featured_media_type || '';

	let activeType = null;
	let activeId = 0;
	if ( featuredImageId ) {
		activeType = 'image';
		activeId = featuredImageId;
	} else if ( featuredMediaId && featuredMediaType ) {
		activeType = featuredMediaType;
		activeId = featuredMediaId;
	}

	// undefined = still loading, null = not found, object = loaded.
	const activeMedia = useSelect(
		( select ) =>
			activeId
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						activeId,
						{ context: 'view' }
				  )
				: null,
		[ activeId ]
	);

	const { editPost } = useDispatch( editorStore );

	const mediaName =
		activeMedia?.title?.rendered ||
		activeMedia?.slug ||
		__( 'Featured media' );

	// For images, pick the best available thumbnail size.
	const thumbnailUrl =
		activeType === 'image' && activeMedia
			? activeMedia?.media_details?.sizes?.large?.source_url ||
			  activeMedia?.media_details?.sizes?.thumbnail?.source_url ||
			  activeMedia?.source_url
			: null;

	const isLoading = !! activeId && activeMedia === undefined;

	function onSelect( selected ) {
		const type = getMediaType( selected );
		if ( type === 'image' ) {
			editPost( {
				featured_media: selected.id,
				meta: {
					...meta,
					_featured_media_id: 0,
					_featured_media_type: '',
				},
			} );
		} else {
			editPost( {
				featured_media: 0,
				meta: {
					...meta,
					_featured_media_id: selected.id,
					_featured_media_type: type,
				},
			} );
		}
	}

	function onRemove() {
		editPost( {
			featured_media: 0,
			meta: {
				...meta,
				_featured_media_id: 0,
				_featured_media_type: '',
			},
		} );
	}

	return (
		<BaseControl
			id={ instanceId }
			label={ __( 'Featured media' ) }
			__nextHasNoMarginBottom
		>
			<div className="editor-post-featured-image">
				<MediaUploadCheck>
					<MediaUpload
						title={ __( 'Featured media' ) }
						onSelect={ onSelect }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						render={ ( { open } ) => (
							<div className="editor-post-featured-image__container">
								{ /* Loading state */ }
								{ isLoading && (
									<Button
										__next40pxDefaultSize
										className="editor-post-featured-image__toggle"
										disabled
										accessibleWhenDisabled
									>
										<Spinner />
									</Button>
								) }
								{ /* No media: upload/select button */ }
								{ ! isLoading && ! activeId && (
									<Button
										__next40pxDefaultSize
										className="editor-post-featured-image__toggle"
										onClick={ open }
										aria-haspopup="dialog"
									>
										{ __( 'Add featured media' ) }
									</Button>
								) }
								{ /* Image: thumbnail inside a clickable button */ }
								{ ! isLoading && activeType === 'image' && (
									<Button
										__next40pxDefaultSize
										className="editor-post-featured-image__preview"
										onClick={ open }
										aria-label={ __(
											'Edit or replace the featured media'
										) }
										aria-haspopup="dialog"
									>
										{ thumbnailUrl ? (
											<img
												className="editor-post-featured-image__preview-image"
												src={ thumbnailUrl }
												alt={ mediaName }
											/>
										) : (
											mediaName
										) }
									</Button>
								) }
								{ /* Video: native player — Replace/Remove handle the library */ }
								{ ! isLoading &&
									activeType === 'video' &&
									activeMedia && (
										<video
											className="editor-post-featured-image__preview-video"
											src={ activeMedia.source_url }
											controls
											preload="metadata"
										/>
									) }
								{ /* Audio: native player */ }
								{ ! isLoading &&
									activeType === 'audio' &&
									activeMedia && (
										<audio
											className="editor-post-featured-image__preview-audio"
											src={ activeMedia.source_url }
											controls
										/>
									) }
								{ !! activeId && ! isLoading && (
									<Stack className="editor-post-featured-image__actions">
										<Button
											__next40pxDefaultSize
											className="editor-post-featured-image__action"
											onClick={ open }
											aria-haspopup="dialog"
										>
											{ __( 'Replace' ) }
										</Button>
										<Button
											__next40pxDefaultSize
											className="editor-post-featured-image__action"
											onClick={ onRemove }
										>
											{ __( 'Remove' ) }
										</Button>
									</Stack>
								) }
							</div>
						) }
						value={ activeId }
					/>
				</MediaUploadCheck>
			</div>
		</BaseControl>
	);
}
