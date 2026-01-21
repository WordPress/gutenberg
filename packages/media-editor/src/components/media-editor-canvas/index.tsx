/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { ImageCropper as ImageCropperComponent } from '@wordpress/image-cropper';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';

/**
 * MediaEditorCanvas component renders the image cropper when in editing mode.
 * This is a sibling component to MediaPreview and only renders when editing an image.
 *
 * Note: ImageCropperProvider is provided by AttachmentEditorProvider at a higher level,
 * so both this component and the sidebar controls can access the same cropper state.
 */
export default function MediaEditorCanvas() {
	const { media, isEditingImage } = useMediaEditorContext();
	const [ contentResizeListener, { width: clientWidth } ] =
		useResizeObserver();
	const [ naturalDimensions, setNaturalDimensions ] = useState< {
		width: number;
		height: number;
	} | null >( null );

	const isLoading = ! media?.source_url;
	const imageUrl = media?.source_url || '';

	// Load the image to get natural dimensions
	useEffect( () => {
		if ( ! imageUrl ) {
			return;
		}

		const img = new Image();
		img.onload = () => {
			setNaturalDimensions( {
				width: img.naturalWidth,
				height: img.naturalHeight,
			} );
		};
		img.src = imageUrl;
	}, [ imageUrl ] );

	// Calculate height based on aspect ratio
	let containerHeight = 400; // Default fallback
	if ( naturalDimensions && clientWidth ) {
		containerHeight =
			( clientWidth * naturalDimensions.height ) /
			naturalDimensions.width;
	}

	// Only render when editing an image
	if ( ! isEditingImage || media?.mime_type?.split( '/' )[ 0 ] !== 'image' ) {
		return null;
	}

	return (
		<>
			{ contentResizeListener }
			<div
				className={ clsx( 'media-editor-canvas', {
					'is-loading': isLoading || ! naturalDimensions,
				} ) }
			>
				{ isLoading || ! naturalDimensions ? (
					<div className="media-editor-canvas__spinner">
						<Spinner />
					</div>
				) : (
					<div
						className="media-editor-canvas__crop-area"
						style={ {
							width: clientWidth || '100%',
							height: containerHeight,
						} }
					>
						<ImageCropperComponent src={ imageUrl } />
					</div>
				) }
			</div>
		</>
	);
}
