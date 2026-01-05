/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	SelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ImageCropper from '../components/image-cropper';
import ImageCropperProvider, { useImageCropper } from '../provider';
import type { ImageCropperProps, MediaSize } from '../types';
import { MIN_ZOOM, MAX_ZOOM } from '../constants';
import './style.css';

export default {
	title: 'ImageCropper/ImageCropper',
	component: ImageCropper,
};

const DefaultComponent = ( args: ImageCropperProps ) => {
	return (
		<ImageCropperProvider>
			<div className="image-cropper__container-wrapper-story">
				<div className="image-cropper__container-story">
					<ImageCropper { ...args } />
				</div>
			</div>
		</ImageCropperProvider>
	);
};

export const Default = {
	render: DefaultComponent,
	args: {
		src: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
		minZoom: 1,
		maxZoom: 5,
	},
};

const WithControlsComponent = ( args: ImageCropperProps ) => {
	return (
		<ImageCropperProvider>
			<WithControlsContent { ...args } />
		</ImageCropperProvider>
	);
};

const WithControlsContent = ( args: ImageCropperProps ) => {
	const { cropperState, setCropperState } = useImageCropper();
	const containerRef = useRef< HTMLDivElement | null >( null );
	const { containerStyle, handleOnload } = useHandleOnload( containerRef );
	const handleRotateLeft = useCallback( () => {
		setCropperState( { rotation: cropperState.rotation - 90 } );
	}, [ cropperState.rotation, setCropperState ] );

	const handleRotateRight = useCallback( () => {
		setCropperState( { rotation: cropperState.rotation + 90 } );
	}, [ cropperState.rotation, setCropperState ] );

	const handleFlipHorizontal = useCallback( () => {
		setCropperState( {
			flip: {
				horizontal: ! cropperState.flip.horizontal,
				vertical: cropperState.flip.vertical,
			},
		} );
	}, [
		cropperState.flip.vertical,
		cropperState.flip.horizontal,
		setCropperState,
	] );

	const handleFlipVertical = useCallback( () => {
		setCropperState( {
			flip: {
				horizontal: cropperState.flip.horizontal,
				vertical: ! cropperState.flip.vertical,
			},
		} );
	}, [
		cropperState.flip.vertical,
		cropperState.flip.horizontal,
		setCropperState,
	] );

	const handleZoomChange = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			setCropperState( { zoom: parseFloat( event.target.value ) } );
		},
		[ setCropperState ]
	);

	const handleAspectRatioChange = useCallback(
		( value: string ) => {
			setCropperState( { aspectRatio: parseFloat( value ) } );
		},
		[ setCropperState ]
	);

	const reset = useCallback( () => {
		setCropperState( {
			rotation: 0,
			zoom: MIN_ZOOM,
			aspectRatio: 1,
			flip: { horizontal: false, vertical: false },
			crop: { x: 0, y: 0 },
		} );
	}, [ setCropperState ] );

	const aspectRatioOptions = [
		{ label: __( '1:1 (Square)' ), value: '1' },
		{ label: __( '16:9 (Widescreen)' ), value: ( 16 / 9 ).toString() },
		{ label: __( '9:16 (Portrait)' ), value: ( 9 / 16 ).toString() },
		{ label: __( '4:3 (Standard)' ), value: ( 4 / 3 ).toString() },
		{ label: __( '3:4 (Portrait)' ), value: ( 3 / 4 ).toString() },
	];

	return (
		<>
			<VStack spacing={ 4 }>
				<VStack spacing={ 2 }>
					<Heading level={ 5 }>
						{ ' ' }
						{ sprintf(
							/* translators: %d: rotation anglein degrees */
							__( 'Rotation: %d' ),
							cropperState.rotation
						) }
					</Heading>
					<HStack justify="flex-start" spacing={ 4 }>
						<button onClick={ handleRotateLeft }>
							{ __( 'Rotate left' ) }
						</button>
						<button onClick={ handleRotateRight }>
							{ __( 'Rotate right' ) }
						</button>
					</HStack>
				</VStack>
				<VStack spacing={ 2 }>
					<Heading level={ 5 }>
						{ ' ' }
						{ sprintf(
							/* translators: 1: horizontal flip, 2: vertical flip */
							__( 'Flip: %1$s / %2$s' ),
							cropperState.flip.horizontal
								? __( 'Horizontal' )
								: __( 'None' ),
							cropperState.flip.vertical
								? __( 'Vertical' )
								: __( 'None' )
						) }
					</Heading>
					<HStack justify="flex-start" spacing={ 4 }>
						<button onClick={ handleFlipHorizontal }>
							{ __( 'Flip horizontal' ) }
						</button>
						<button onClick={ handleFlipVertical }>
							{ __( 'Flip vertical' ) }
						</button>
					</HStack>
				</VStack>
				<VStack spacing={ 2 }>
					<Heading level={ 5 }>
						{ sprintf(
							/* translators: %s: zoom level */
							__( 'Zoom: %s' ),
							cropperState.zoom.toFixed( 2 )
						) }
					</Heading>
					<VStack spacing={ 2 }>
						<input
							type="range"
							min={ MIN_ZOOM }
							max={ MAX_ZOOM }
							step="0.1"
							value={ cropperState.zoom }
							onChange={ handleZoomChange }
						/>
					</VStack>
				</VStack>
				<VStack spacing={ 2 }>
					<Heading level={ 5 }>
						{ sprintf(
							/* translators: %s: aspect ratio */
							__( 'Aspect Ratio: %s' ),
							cropperState.aspectRatio.toFixed( 2 )
						) }
					</Heading>
					<SelectControl
						value={ cropperState.aspectRatio.toString() }
						options={ aspectRatioOptions }
						onChange={ handleAspectRatioChange }
						__next40pxDefaultSize
					/>
				</VStack>
				<HStack style={ { marginBottom: '20px' } } spacing={ 2 }>
					<button onClick={ reset }>{ __( 'Reset' ) }</button>
				</HStack>
			</VStack>

			<div className="image-cropper__container-wrapper-story">
				<div
					className="image-cropper__container-story"
					ref={ containerRef }
					style={ {
						...containerStyle,
					} }
				>
					<ImageCropper { ...args } onLoad={ handleOnload } />
				</div>
			</div>
		</>
	);
};

export const WithControls = {
	render: WithControlsComponent,
	args: {
		src: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
		minZoom: 1,
		maxZoom: 5,
	},
};

// Utils.

/**
 * Handles the onload event of the image cropper, calculating the maximum scale that can be used to fit the image into the container.
 *
 * @param containerRef - The ref to the container element.
 * @return The container style and the handleOnload function.
 */
function useHandleOnload( containerRef: React.RefObject< HTMLDivElement > ) {
	const [ containerStyle, setContainerStyle ] = useState< {
		minHeight?: string;
		minWidth?: string;
		maxWidth?: string;
		maxHeight?: string;
	} | null >( null );
	const handleOnload = useCallback(
		( mediaSize: MediaSize ) => {
			/*
			 * Because rotation is performed using CSS transforms, the media is outside the flow
			 * of the container. The cropper lib does not handle dynamic resize by default,
			 * so the solution is just to adjust the container so that the image will fit
			 * inside the crop area regardless of the rotation.
			 */
			if (
				containerRef &&
				containerRef.current?.offsetWidth &&
				containerRef.current?.offsetHeight
			) {
				const { scaledWidth, scaledHeight } =
					getMaximumScaledDimensions(
						mediaSize.width,
						mediaSize.height,
						containerRef.current.offsetWidth,
						containerRef.current.offsetHeight
					);
				/*
				 * Depending on the image's aspect ration, allow scaling with window.
				 * Set minHeight/maxHeight to the container width to ensure that the image
				 * fits into the crop area, even when the image is rotated.
				 */
				if ( mediaSize.width > containerRef.current.offsetHeight ) {
					setContainerStyle( {
						maxWidth: `${ scaledWidth }px`,
						minHeight: `${ scaledWidth }px`,
					} );
				} else if (
					mediaSize.height > containerRef.current.offsetWidth
				) {
					setContainerStyle( {
						maxHeight: `${ scaledHeight }px`,
						minWidth: `${ scaledHeight }px`,
					} );
				}
			}
		},
		[ containerRef ]
	);
	return { containerStyle, handleOnload };
}

/**
 * Calculates the maximum scale that can be used to fit the image into the container.
 * To maximize the bounding box, this function assumes 90° rotations (0°, 90°, 180°, 270°) only.
 *
 * Later, if 0-360° rotations are supported, this function will need to be updated
 * to account for the maximum diagonal dimensions. E.g.,
 *
 * ```
 * 	 // The maximum bounding box dimensions occur at 45° for rectangles.
 * 	 // Max bounding width/height = (width + height) / √2 * √2 = width + height
 * 	 // But this is only true for squares. For rectangles, we need to be more precise.
 * 	 const diagonal = Math.sqrt(
 * 	 	imageWidth * imageWidth + imageHeight * imageHeight
 * 	 );
 *
 * 	// Scale to fit this maximum bounding square in the container.
 * 	const scale = Math.min(
 * 		containerWidth / diagonal,
 * 		containerHeight / diagonal
 * 	);
 * ```
 *
 * @param imageWidth      - The width of the image.
 * @param imageHeight     - The height of the image.
 * @param containerWidth  - The width of the container.
 * @param containerHeight - The height of the container.
 */
function getMaximumScaledDimensions(
	imageWidth: number,
	imageHeight: number,
	containerWidth: number,
	containerHeight: number
): {
	scale: number;
	scaledWidth: number;
	scaledHeight: number;
} {
	// Calculate scale for original orientation.
	const scaleOriginal = Math.min(
		containerWidth / imageWidth,
		containerHeight / imageHeight
	);

	// Calculate scale for 90° rotated orientation.
	const scaleRotated = Math.min(
		containerWidth / imageHeight, // Rotated width is original height.
		containerHeight / imageWidth // Rotated height is original width.
	);

	// Use the smaller scale to ensure it fits in both orientations
	const scale = Math.min( scaleOriginal, scaleRotated );

	return {
		scale,
		scaledWidth: imageWidth * scale,
		scaledHeight: imageHeight * scale,
	};
}
