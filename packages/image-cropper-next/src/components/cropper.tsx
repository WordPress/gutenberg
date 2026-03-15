/**
 * External dependencies
 */

import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	CropperState,
	CropperAction,
	StencilProps,
	Size,
	NormalizedRect,
} from '../core/types';
import { useContainerFit } from '../hooks/use-container-fit';
import { useInteraction } from '../hooks/use-interaction';
import { useTransformStyle } from '../hooks/use-transform-style';
import { RectangleStencil } from './stencils/rectangle-stencil';
import { DimmingOverlay } from './overlays/dimming-overlay';
import { GridOverlay } from './overlays/grid-overlay';
import './cropper.scss';

/**
 * Props for the Cropper component.
 */
export interface CropperProps {
	/** Image source URL. */
	src: string;
	/** Cropper state from useCropperState. */
	state: CropperState;
	/** Dispatch function from useCropperState. */
	dispatch: React.Dispatch< CropperAction >;
	/** Stencil component for the crop area. Defaults to RectangleStencil. */
	stencil?: React.ComponentType< StencilProps >;
	/** Show the rule-of-thirds grid overlay. */
	showGrid?: boolean;
	/** Show the dimming overlay outside the crop area. */
	showDimming?: boolean;
	/** Minimum zoom level. */
	minZoom?: number;
	/** Maximum zoom level. */
	maxZoom?: number;
	/** Fixed aspect ratio (width / height) in pixel space for the crop area. */
	aspectRatio?: number;
	/** Callback fired when the image is loaded. */
	onImageLoaded?: ( size: Size ) => void;
	/** Additional className for the container. */
	className?: string;
}

/**
 * The main image cropper component.
 *
 * Renders an image within a container with interactive crop overlays.
 * Composes the useContainerFit, useInteraction, and useTransformStyle hooks.
 * Renders the stencil, dimming overlay, and grid overlay on top of the image.
 *
 * The component fills its parent container (100% width and height).
 * Wrap it in a sized container to control its dimensions.
 */
export const Cropper = forwardRef< HTMLDivElement, CropperProps >(
	function Cropper(
		{
			src,
			state,
			dispatch,
			stencil: StencilComponent = RectangleStencil,
			showGrid = false,
			showDimming = true,
			minZoom,
			maxZoom,
			aspectRatio,
			onImageLoaded,
			className,
		}: CropperProps,
		ref: React.ForwardedRef< HTMLDivElement >
	) {
		const { containerRef, containerSize, getImageStyle } =
			useContainerFit();

		const [ naturalSize, setNaturalSize ] = useState< Size >( {
			width: 0,
			height: 0,
		} );

		// Compute the rendered image element dimensions (unrotated).
		const renderedImageSize = useMemo< Size >( () => {
			if ( naturalSize.width === 0 || naturalSize.height === 0 ) {
				return { width: 0, height: 0 };
			}
			const fitStyle = getImageStyle(
				naturalSize.width,
				naturalSize.height,
				state.rotation
			);
			return {
				width: typeof fitStyle.width === 'number' ? fitStyle.width : 0,
				height:
					typeof fitStyle.height === 'number' ? fitStyle.height : 0,
			};
		}, [ naturalSize, state.rotation, getImageStyle ] );

		// Compute the visual (rotated) image footprint for stencil positioning.
		// The <img> element is CSS-rotated, so its visual bounding box on screen
		// differs from its element dimensions. The stencil and overlays need the
		// visual size to position correctly.
		const visualImageSize = useMemo< Size >( () => {
			if (
				renderedImageSize.width === 0 ||
				renderedImageSize.height === 0
			) {
				return { width: 0, height: 0 };
			}
			const rad = ( state.rotation * Math.PI ) / 180;
			const cosR = Math.abs( Math.cos( rad ) );
			const sinR = Math.abs( Math.sin( rad ) );
			return {
				width:
					cosR * renderedImageSize.width +
					sinR * renderedImageSize.height,
				height:
					sinR * renderedImageSize.width +
					cosR * renderedImageSize.height,
			};
		}, [ renderedImageSize, state.rotation ] );

		// Use the interaction hook for mouse, touch, and keyboard events.
		// Pan deltas are normalized by visualImageSize so crop.x/crop.y
		// are in visual-space normalized coordinates.
		const { handlers } = useInteraction(
			state,
			dispatch,
			containerSize,
			visualImageSize,
			{
				minZoom,
				maxZoom,
			}
		);

		// Use the transform style hook for the image CSS transform.
		// Uses visualImageSize so crop.x * visualW gives correct
		// screen-space pixel translation.
		const transformString = useTransformStyle(
			state,
			containerSize,
			visualImageSize
		);

		/**
		 * Handle the image load event. Measures the natural size,
		 * dispatches SET_IMAGE, and calls the onImageLoaded callback.
		 */
		const handleImageLoad = useCallback(
			( event: React.SyntheticEvent< HTMLImageElement > ) => {
				const img = event.currentTarget;
				const size: Size = {
					width: img.naturalWidth,
					height: img.naturalHeight,
				};

				setNaturalSize( size );

				dispatch( {
					type: 'SET_IMAGE',
					payload: {
						src,
						naturalWidth: size.width,
						naturalHeight: size.height,
					},
				} );

				onImageLoaded?.( size );
			},
			[ src, dispatch, onImageLoaded ]
		);

		/**
		 * Handle crop rect changes from the stencil.
		 */
		const handleCropChange = useCallback(
			( rect: NormalizedRect ) => {
				dispatch( { type: 'SET_CROP_RECT', payload: rect } );
			},
			[ dispatch ]
		);

		// Compute the image's CSS style combining fit dimensions, centering, and transform.
		const imageStyle = useMemo( (): React.CSSProperties => {
			if ( naturalSize.width === 0 || naturalSize.height === 0 ) {
				return {};
			}

			const fitStyle = getImageStyle(
				naturalSize.width,
				naturalSize.height,
				state.rotation
			);

			// Center the image within the container.
			const imgW =
				typeof fitStyle.width === 'number' ? fitStyle.width : 0;
			const imgH =
				typeof fitStyle.height === 'number' ? fitStyle.height : 0;
			const centerX = ( containerSize.width - imgW ) / 2;
			const centerY = ( containerSize.height - imgH ) / 2;

			return {
				...fitStyle,
				left: centerX,
				top: centerY,
				transform: transformString,
			};
		}, [
			naturalSize,
			containerSize,
			state.rotation,
			getImageStyle,
			transformString,
		] );

		// Merge the forwarded ref with the internal container ref.
		/* eslint-disable react-compiler/react-compiler */
		const setContainerRef = useCallback(
			( element: HTMLDivElement | null ) => {
				// Update the internal container ref.
				(
					containerRef as React.MutableRefObject< HTMLDivElement | null >
				 ).current = element;

				// Forward to external ref.
				if ( typeof ref === 'function' ) {
					ref( element );
				} else if ( ref ) {
					(
						ref as React.MutableRefObject< HTMLDivElement | null >
					 ).current = element;
				}
			},
			[ containerRef, ref ]
		);
		/* eslint-enable react-compiler/react-compiler */

		return (
			<div
				ref={ setContainerRef }
				className={ clsx( 'wp-image-cropper-next', className ) }
				tabIndex={ 0 }
				role="application"
				aria-label="Image cropper"
				{ ...handlers }
			>
				{ /* The image layer */ }
				<img
					className="wp-image-cropper-next__image"
					src={ src }
					alt=""
					onLoad={ handleImageLoad }
					style={ imageStyle }
					draggable={ false }
				/>

				{ /* Dimming overlay outside the crop area */ }
				{ showDimming && (
					<DimmingOverlay
						cropRect={ state.cropRect }
						containerSize={ containerSize }
						imageSize={ visualImageSize }
					/>
				) }

				{ /* The stencil (crop area with handles) */ }
				<StencilComponent
					cropRect={ state.cropRect }
					containerSize={ containerSize }
					imageSize={ visualImageSize }
					onCropChange={ handleCropChange }
					aspectRatio={ aspectRatio }
				/>

				{ /* Rule-of-thirds grid */ }
				{ showGrid && (
					<GridOverlay
						cropRect={ state.cropRect }
						containerSize={ containerSize }
						imageSize={ visualImageSize }
					/>
				) }
			</div>
		);
	}
);
