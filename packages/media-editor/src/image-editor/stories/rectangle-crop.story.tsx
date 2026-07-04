/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import {
	Button,
	SelectControl,
	RangeControl,
	ToggleControl,
	Flex,
	FlexItem,
} from '@wordpress/components';
import {
	rotateLeft,
	rotateRight,
	flipHorizontal,
	flipVertical,
	reset as resetIcon,
	cloudUpload,
	download as downloadIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Cropper } from '../react/components/cropper';
import { useCropperReducer } from '../react/hooks/use-cropper-reducer';
import {
	MAX_ZOOM,
	MAX_ROTATION_OFFSET,
	DEFAULT_ASPECT_RATIOS,
	ORIGINAL_ASPECT_RATIO,
} from '../core/constants';
import { getMinZoom, restrictPanZoom } from '../core/containment';
import {
	loadImage,
	renderToCanvas,
	canvasToDataURL,
	downloadCroppedImage,
} from '../core/export/canvas-renderer';
import {
	getRotatedBBox,
	createCamera,
	screenToWorld,
	getImageFit,
	getVisibleBounds,
} from '../core/camera';
import { getSourceRegion } from '../core/source-region';
import './style.css';

const SAMPLE_IMAGE = 'image-editor-demo.jpeg';

const GRID_MODES = {
	off: false,
	on: true,
	interactive: 'interactive',
} as const;

type GridMode = keyof typeof GRID_MODES;

const IMAGE_CREDIT = (
	<p style={ { fontSize: 10, color: '#aaa', margin: '4px 0 0' } }>
		{ '"A fashionable melange of English words (1887)" ' }
		<a
			href="http://publicdomainreview.org/2013/01/23/a-fashionable-melange-of-english-words-1887"
			style={ { color: '#bbb' } }
		>
			publicdomainreview.org
		</a>
		{ ' by See-ming Lee (SML) is licensed under CC BY 2.0.' }
	</p>
);

// Hook: manage a swappable image source. Defaults to the sample image.
// When a file is picked, reads it as a data URL so the <img> src updates
// without leaving the page. The consumer also gets a reset callback to
// return to the sample.
function useUploadableImage() {
	const [ src, setSrc ] = useState< string >( SAMPLE_IMAGE );
	const [ isCustom, setIsCustom ] = useState( false );
	const handleFileChange = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const file = event.target.files?.[ 0 ];
			if ( ! file ) {
				return;
			}
			const reader = new FileReader();
			reader.onload = () => {
				if ( typeof reader.result === 'string' ) {
					setSrc( reader.result );
					setIsCustom( true );
				}
			};
			reader.readAsDataURL( file );
		},
		[]
	);
	const resetToSample = useCallback( () => {
		setSrc( SAMPLE_IMAGE );
		setIsCustom( false );
	}, [] );
	return { src, isCustom, handleFileChange, resetToSample };
}

/**
 * Resolve an aspect ratio value from the select dropdown.
 * 0 = free (no lock), ORIGINAL_ASPECT_RATIO (-1) = image's natural ratio.
 */
function resolveAspectRatio(
	value: string,
	imageState: { naturalWidth: number; naturalHeight: number } | null
): number | undefined {
	const num = parseFloat( value );
	if ( num === 0 ) {
		return undefined; // Free — no lock.
	}
	if ( num === ORIGINAL_ASPECT_RATIO && imageState ) {
		return imageState.naturalWidth / imageState.naturalHeight;
	}
	if ( num > 0 ) {
		return num;
	}
	return undefined;
}

const meta: Meta< typeof Cropper > = {
	title: 'MediaEditor/ImageEditor',
	component: Cropper,
	tags: [ 'status-experimental' ],
};

export default meta;

type Story = StoryObj< typeof Cropper >;

/**
 * Default story. Basic cropper with a sample image, no controls.
 */
const DefaultComponent = () => {
	const controller = useCropperReducer();

	return (
		<div>
			<div className="image-editor-story__container">
				<Cropper
					src={ SAMPLE_IMAGE }
					controller={ controller }
					showDimming
				/>
			</div>
			{ IMAGE_CREDIT }
		</div>
	);
};

export const Default: Story = {
	render: DefaultComponent,
};

/**
 * Full interactive demo with controls.
 */
const WithControlsComponent = () => {
	const controller = useCropperReducer();
	const {
		state,
		setRotation,
		setFlip,
		setZoom,
		setCropRect,
		snapRotate90,
		reset,
		isDirty,
	} = controller;

	const [ aspectRatioValue, setAspectRatioValue ] = useState( '0' );
	const [ freeformCrop, setFreeformCrop ] = useState( false );
	const [ gridMode, setGridMode ] = useState< GridMode >( 'interactive' );
	const { src, isCustom, handleFileChange, resetToSample } =
		useUploadableImage();
	const fileInputRef = useRef< HTMLInputElement >( null );
	const openFilePicker = useCallback( () => {
		fileInputRef.current?.click();
	}, [] );

	// Reset crop/pan/zoom when the image changes so the old framing
	// doesn't linger on a newly-shaped image.
	const prevSrcRef = useRef( src );
	useEffect( () => {
		if ( prevSrcRef.current !== src ) {
			prevSrcRef.current = src;
			reset();
			setAspectRatioValue( '0' );
		}
	}, [ src, reset ] );

	// Compute the crop dimensions in source pixels.
	const cropDimensions = state.image
		? getSourceRegion( state, {
				width: state.image.naturalWidth,
				height: state.image.naturalHeight,
		  } )
		: null;

	// The base cardinal angle (nearest 90° step) and the fine offset.
	// `setRotation` is a raw state setter (absolute-angle assignment), so
	// sliders need to flip the offset sign when a single flip is active to
	// stay visually consistent. `snapRotate90` and the pipeline `rotate`
	// op already handle this internally.
	const baseAngle = Math.round( state.rotation / 90 ) * 90;
	const singleFlip = state.flip.horizontal !== state.flip.vertical;
	const visualDir = singleFlip ? -1 : 1;
	const fineOffset = ( state.rotation - baseAngle ) * visualDir;

	const handleRotateLeft = useCallback( () => {
		snapRotate90( -1 );
	}, [ snapRotate90 ] );

	const handleRotateRight = useCallback( () => {
		snapRotate90( 1 );
	}, [ snapRotate90 ] );

	const handleRotationSlider = useCallback(
		( value: number | undefined ) => {
			if ( value === undefined ) {
				return;
			}
			// Clamp strictly inside [-MAX, MAX). Reaching exactly ±MAX
			// lands state.rotation on a 90° midpoint, which flips the
			// computed baseAngle on the next render; subsequent slider
			// events then spiral because they're added to the NEW base.
			const EPS = 0.01;
			const clamped = Math.max(
				-MAX_ROTATION_OFFSET + EPS,
				Math.min( MAX_ROTATION_OFFSET - EPS, value )
			);
			setRotation( baseAngle + clamped * visualDir );
		},
		[ baseAngle, setRotation, visualDir ]
	);

	const handleFlipHorizontal = useCallback( () => {
		setFlip( {
			horizontal: ! state.flip.horizontal,
			vertical: state.flip.vertical,
		} );
	}, [ state.flip, setFlip ] );

	const handleFlipVertical = useCallback( () => {
		setFlip( {
			horizontal: state.flip.horizontal,
			vertical: ! state.flip.vertical,
		} );
	}, [ state.flip, setFlip ] );

	const handleZoomChange = useCallback(
		( value: number | undefined ) => {
			if ( value === undefined ) {
				return;
			}
			setZoom( value );
		},
		[ setZoom ]
	);

	const handleAspectRatioChange = useCallback(
		( value: string ) => {
			setAspectRatioValue( value );

			// In fixed mode (freeformCrop=false), the cropper's useEffect
			// auto-computes the crop rect from the aspect ratio. In freeform
			// mode, we adjust the crop rect here to fit the new ratio.
			const resolved = resolveAspectRatio( value, state.image );
			if ( freeformCrop && resolved && resolved > 0 && state.image ) {
				const ratio = resolved;
				const natW = state.image.naturalWidth;
				const natH = state.image.naturalHeight;
				const visualBBox = getRotatedBBox( natW, natH, state.rotation );
				// normalizedRatio = w/h in normalized space that produces
				// the desired pixel aspect ratio.
				const normalizedRatio =
					( ratio * visualBBox.height ) / visualBBox.width;

				let w = state.cropRect.width;
				let h = w / normalizedRatio;

				if ( h > 1 ) {
					h = state.cropRect.height;
					w = h * normalizedRatio;
				}

				w = Math.min( w, 1 );
				h = Math.min( h, 1 );

				setCropRect( {
					x: ( 1 - w ) / 2,
					y: ( 1 - h ) / 2,
					width: w,
					height: h,
				} );
			}
		},
		[
			freeformCrop,
			state.image,
			state.cropRect,
			state.rotation,
			setCropRect,
		]
	);

	const handleReset = useCallback( () => {
		reset();
		setAspectRatioValue( '0' );
	}, [ reset ] );

	return (
		<div>
			<input
				ref={ fileInputRef }
				type="file"
				accept="image/*"
				onChange={ handleFileChange }
				className="image-editor-story__hidden-file"
			/>
			<div className="image-editor-story__toolbar">
				<Flex align="center" gap={ 2 } wrap>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="primary"
							icon={ cloudUpload }
							onClick={ openFilePicker }
						>
							Upload
						</Button>
					</FlexItem>
					{ isCustom && (
						<FlexItem>
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								onClick={ resetToSample }
							>
								Use sample
							</Button>
						</FlexItem>
					) }
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ rotateLeft }
							label="Rotate 90° counter-clockwise"
							showTooltip
							onClick={ handleRotateLeft }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ rotateRight }
							label="Rotate 90° clockwise"
							showTooltip
							onClick={ handleRotateRight }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ flipHorizontal }
							label="Flip horizontal"
							showTooltip
							isPressed={ state.flip.horizontal }
							onClick={ handleFlipHorizontal }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ flipVertical }
							label="Flip vertical"
							showTooltip
							isPressed={ state.flip.vertical }
							onClick={ handleFlipVertical }
						/>
					</FlexItem>
					<FlexItem>
						<SelectControl
							__next40pxDefaultSize
							label="Aspect ratio"
							hideLabelFromVision
							value={ aspectRatioValue }
							onChange={ handleAspectRatioChange }
							options={ DEFAULT_ASPECT_RATIOS.map(
								( preset ) => ( {
									label: preset.label,
									value: preset.value.toString(),
								} )
							) }
						/>
					</FlexItem>
					<FlexItem>
						<ToggleControl
							label="Freeform"
							checked={ freeformCrop }
							onChange={ setFreeformCrop }
						/>
					</FlexItem>
					<FlexItem>
						<SelectControl
							__next40pxDefaultSize
							label="Grid"
							hideLabelFromVision
							value={ gridMode }
							onChange={ ( value ) =>
								setGridMode( value as GridMode )
							}
							options={ [
								{ label: 'Grid: off', value: 'off' },
								{ label: 'Grid: always on', value: 'on' },
								{
									label: 'Grid: interactive',
									value: 'interactive',
								},
							] }
						/>
					</FlexItem>
					<FlexItem isBlock />
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="primary"
							icon={ resetIcon }
							disabled={ ! isDirty }
							accessibleWhenDisabled
							onClick={ handleReset }
						>
							Reset
						</Button>
					</FlexItem>
				</Flex>
				<div className="image-editor-story__sliders">
					<RangeControl
						label="Fine rotation"
						min={ -MAX_ROTATION_OFFSET }
						max={ MAX_ROTATION_OFFSET }
						step={ 0.5 }
						value={ fineOffset }
						onChange={ handleRotationSlider }
					/>
					<RangeControl
						label="Zoom"
						min={ getMinZoom( state ) }
						max={ MAX_ZOOM }
						step={ 0.1 }
						value={ state.zoom }
						onChange={ handleZoomChange }
					/>
				</div>
			</div>

			<div className="image-editor-story__resizable">
				<Cropper
					src={ src }
					controller={ controller }
					showGrid={ GRID_MODES[ gridMode ] }
					showDimming
					freeformCrop={ freeformCrop }
					aspectRatio={ resolveAspectRatio(
						aspectRatioValue,
						state.image
					) }
				/>
			</div>
			<Flex justify="space-between" align="center">
				<FlexItem>{ ! isCustom && IMAGE_CREDIT }</FlexItem>
				{ cropDimensions && (
					<FlexItem
						style={ {
							fontSize: 11,
							color: '#757575',
							fontFamily: 'monospace',
						} }
					>
						{ Math.round( cropDimensions.width ) } ×{ ' ' }
						{ Math.round( cropDimensions.height ) } px
					</FlexItem>
				) }
			</Flex>

			<div style={ { marginTop: 16 } }>
				<strong>Current State:</strong>
				<pre className="image-editor-story__state">
					{ JSON.stringify(
						{
							rotation: state.rotation,
							zoom: state.zoom,
							cropRect: state.cropRect,
							pan: state.pan,
							image: state.image
								? {
										naturalWidth: state.image.naturalWidth,
										naturalHeight:
											state.image.naturalHeight,
								  }
								: null,
						},
						null,
						2
					) }
				</pre>
			</div>
		</div>
	);
};

export const WithControls: Story = {
	render: WithControlsComponent,
};

/**
 * Debug visualization showing camera internals, export preview, and
 * image info alongside the cropper.
 *
 * Displays the camera matrix, crop corner world-space coordinates,
 * restriction values, source region, and a live export preview --
 * updated live as you interact. Use this to debug containment issues
 * or verify the camera and render paths agree.
 */
const DebugComponent = () => {
	const controller = useCropperReducer();
	const {
		state,
		setRotation,
		setZoom,
		setFlip,
		snapRotate90,
		reset,
		isDirty,
	} = controller;

	const [ freeformCrop, setFreeformCrop ] = useState( false );
	const [ exportFormat, setExportFormat ] =
		useState< string >( 'image/jpeg' );
	const { src, isCustom, handleFileChange, resetToSample } =
		useUploadableImage();
	const fileInputRef = useRef< HTMLInputElement >( null );
	const [ previewSrc, setPreviewSrc ] = useState< string | null >( null );
	const imageRef = useRef< HTMLImageElement | null >( null );

	// Reset crop/pan/zoom when the image changes.
	const prevSrcRef = useRef( src );
	useEffect( () => {
		if ( prevSrcRef.current !== src ) {
			prevSrcRef.current = src;
			reset();
		}
	}, [ src, reset ] );

	const [ containerSize, setContainerSize ] = useState( {
		width: 0,
		height: 0,
	} );
	const containerRef = useRef< HTMLDivElement >( null );

	// Load the source image whenever the src changes (sample or uploaded).
	useEffect( () => {
		let cancelled = false;
		loadImage( src ).then( ( img ) => {
			if ( ! cancelled ) {
				imageRef.current = img;
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ src ] );

	// Re-render the preview whenever state changes.
	useEffect( () => {
		if ( ! imageRef.current || ! state.image ) {
			return;
		}
		const canvas = renderToCanvas( imageRef.current, state );
		setPreviewSrc( canvasToDataURL( canvas, 'image/jpeg', 0.85 ) );
	}, [ state ] );

	// Track container size for camera computations.
	useEffect( () => {
		const el = containerRef.current;
		if ( ! el ) {
			return;
		}
		const ro = new ResizeObserver( ( entries ) => {
			const { width, height } = entries[ 0 ].contentRect;
			setContainerSize( { width, height } );
		} );
		ro.observe( el );
		return () => ro.disconnect();
	}, [] );

	const imageSize = state.image
		? { width: state.image.naturalWidth, height: state.image.naturalHeight }
		: { width: 0, height: 0 };

	const hasImage = imageSize.width > 0 && containerSize.width > 0;
	const { elementSize, visualSize } = hasImage
		? getImageFit( containerSize, imageSize, state.rotation )
		: {
				elementSize: { width: 0, height: 0 },
				visualSize: { width: 0, height: 0 },
		  };

	// Camera and restriction.
	const camera = hasImage
		? createCamera( state, containerSize, imageSize )
		: null;
	const baseCamera = hasImage
		? createCamera(
				{ ...state, pan: { x: 0, y: 0 }, zoom: 1 },
				containerSize,
				imageSize
		  )
		: null;
	const vb = baseCamera ? getVisibleBounds( baseCamera ) : null;

	// Crop corners in world space (should be inside [0,1] when contained).
	const cropWorldCorners =
		camera && vb
			? [
					screenToWorld( camera, {
						x: vb.left + state.cropRect.x * vb.width,
						y: vb.top + state.cropRect.y * vb.height,
					} ),
					screenToWorld( camera, {
						x:
							vb.left +
							( state.cropRect.x + state.cropRect.width ) *
								vb.width,
						y:
							vb.top +
							( state.cropRect.y + state.cropRect.height ) *
								vb.height,
					} ),
			  ]
			: null;

	// Restriction result.
	const restrictionResult = hasImage
		? restrictPanZoom( state, imageSize, state.cropRect )
		: null;

	// Source region.
	const sourceRegion = hasImage ? getSourceRegion( state, imageSize ) : null;

	// Is contained? All crop corners in [0,1].
	const isContained =
		cropWorldCorners &&
		cropWorldCorners[ 0 ].x >= -0.001 &&
		cropWorldCorners[ 0 ].y >= -0.001 &&
		cropWorldCorners[ 1 ].x <= 1.001 &&
		cropWorldCorners[ 1 ].y <= 1.001;

	// `setRotation` is a raw state setter (absolute-angle assignment), so
	// sliders need to flip the offset sign when a single flip is active
	// to stay visually consistent. `snapRotate90` already handles this.
	const baseAngle = Math.round( state.rotation / 90 ) * 90;
	const singleFlip = state.flip.horizontal !== state.flip.vertical;
	const visualDir = singleFlip ? -1 : 1;
	const fineOffset = ( state.rotation - baseAngle ) * visualDir;

	const handleRotateLeft = useCallback( () => {
		snapRotate90( -1 );
	}, [ snapRotate90 ] );

	const handleRotateRight = useCallback( () => {
		snapRotate90( 1 );
	}, [ snapRotate90 ] );

	const handleRotationSlider = useCallback(
		( value: number | undefined ) => {
			if ( value === undefined ) {
				return;
			}
			// Clamp strictly inside [-MAX, MAX). Reaching exactly ±MAX
			// lands state.rotation on a 90° midpoint, which flips the
			// computed baseAngle on the next render; subsequent slider
			// events then spiral because they're added to the NEW base.
			const EPS = 0.01;
			const clamped = Math.max(
				-MAX_ROTATION_OFFSET + EPS,
				Math.min( MAX_ROTATION_OFFSET - EPS, value )
			);
			setRotation( baseAngle + clamped * visualDir );
		},
		[ baseAngle, setRotation, visualDir ]
	);

	const handleZoomChange = useCallback(
		( value: number | undefined ) => {
			if ( value === undefined ) {
				return;
			}
			setZoom( value );
		},
		[ setZoom ]
	);

	const handleFlipHorizontal = useCallback( () => {
		setFlip( {
			horizontal: ! state.flip.horizontal,
			vertical: state.flip.vertical,
		} );
	}, [ state.flip, setFlip ] );

	const handleFlipVertical = useCallback( () => {
		setFlip( {
			horizontal: state.flip.horizontal,
			vertical: ! state.flip.vertical,
		} );
	}, [ state.flip, setFlip ] );

	const openFilePicker = useCallback( () => {
		fileInputRef.current?.click();
	}, [] );

	return (
		<div>
			<input
				ref={ fileInputRef }
				type="file"
				accept="image/*"
				onChange={ handleFileChange }
				className="image-editor-story__hidden-file"
			/>
			<div className="image-editor-story__toolbar">
				<Flex align="center" gap={ 2 } wrap>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="primary"
							icon={ cloudUpload }
							onClick={ openFilePicker }
						>
							Upload
						</Button>
					</FlexItem>
					{ isCustom && (
						<FlexItem>
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								onClick={ resetToSample }
							>
								Use sample
							</Button>
						</FlexItem>
					) }
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ rotateLeft }
							label="Rotate 90° counter-clockwise"
							showTooltip
							onClick={ handleRotateLeft }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ rotateRight }
							label="Rotate 90° clockwise"
							showTooltip
							onClick={ handleRotateRight }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ flipHorizontal }
							label="Flip horizontal"
							showTooltip
							isPressed={ state.flip.horizontal }
							onClick={ handleFlipHorizontal }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ flipVertical }
							label="Flip vertical"
							showTooltip
							isPressed={ state.flip.vertical }
							onClick={ handleFlipVertical }
						/>
					</FlexItem>
					<FlexItem>
						<ToggleControl
							label="Freeform"
							checked={ freeformCrop }
							onChange={ setFreeformCrop }
						/>
					</FlexItem>
					<FlexItem isBlock />
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="primary"
							icon={ resetIcon }
							disabled={ ! isDirty }
							accessibleWhenDisabled
							onClick={ () => reset() }
						>
							Reset
						</Button>
					</FlexItem>
					<FlexItem>
						<SelectControl
							__next40pxDefaultSize
							label="Format"
							hideLabelFromVision
							value={ exportFormat as 'image/jpeg' }
							onChange={ ( value ) =>
								setExportFormat( value as string )
							}
							options={ [
								{ label: 'JPEG', value: 'image/jpeg' },
								{ label: 'PNG', value: 'image/png' },
								{ label: 'WebP', value: 'image/webp' },
							] }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							variant="primary"
							icon={ downloadIcon }
							onClick={ () =>
								downloadCroppedImage(
									src,
									state,
									'cropped',
									exportFormat,
									0.9
								)
							}
						>
							Download
						</Button>
					</FlexItem>
				</Flex>
				<div className="image-editor-story__sliders">
					<RangeControl
						label="Fine rotation"
						min={ -MAX_ROTATION_OFFSET }
						max={ MAX_ROTATION_OFFSET }
						step={ 0.5 }
						value={ fineOffset }
						onChange={ handleRotationSlider }
					/>
					<RangeControl
						label="Zoom"
						min={ getMinZoom( state ) }
						max={ MAX_ZOOM }
						step={ 0.1 }
						value={ state.zoom }
						onChange={ handleZoomChange }
					/>
				</div>
			</div>

			<div
				style={ { display: 'flex', gap: 16, alignItems: 'flex-start' } }
			>
				<div
					ref={ containerRef }
					style={ { flex: '1 1 60%', minWidth: 0 } }
				>
					<div className="image-editor-story__container">
						<Cropper
							src={ src }
							controller={ controller }
							showGrid
							showDimming
							freeformCrop={ freeformCrop }
						/>
					</div>
					{ ! isCustom && IMAGE_CREDIT }
				</div>

				<div
					style={ {
						flex: '0 0 320px',
						fontSize: 11,
						fontFamily: 'monospace',
						lineHeight: 1.5,
						overflow: 'auto',
						maxHeight: 500,
					} }
				>
					<div className="image-editor-story__export-preview">
						{ previewSrc ? (
							<img
								className="image-editor-story__export-image"
								src={ previewSrc }
								alt="Crop preview"
							/>
						) : (
							<p>Loading...</p>
						) }
					</div>
					<strong>Containment</strong>
					<div
						style={ {
							padding: '2px 6px',
							background: isContained ? '#d4edda' : '#f8d7da',
							borderRadius: 3,
							marginBottom: 8,
							display: 'inline-block',
						} }
					>
						{ isContained ? 'COVERED' : 'NOT COVERED' }
					</div>

					{ state.image && (
						<div>
							<strong>Image info</strong>
							<pre style={ { margin: '4px 0' } }>
								{ `original: ${ state.image.naturalWidth }×${
									state.image.naturalHeight
								}
aspect ratio: ${ (
									state.image.naturalWidth /
									state.image.naturalHeight
								).toFixed( 2 ) }` }
							</pre>
						</div>
					) }

					<div>
						<strong>State</strong>
						<pre style={ { margin: '4px 0' } }>
							{ `zoom: ${ state.zoom.toFixed( 3 ) }
rotation: ${ state.rotation.toFixed( 1 ) }°
pan: (${ state.pan.x.toFixed( 4 ) }, ${ state.pan.y.toFixed( 4 ) })
cropRect: (${ state.cropRect.x.toFixed( 3 ) }, ${ state.cropRect.y.toFixed(
								3
							) }) ${ state.cropRect.width.toFixed(
								3
							) }×${ state.cropRect.height.toFixed( 3 ) }
flip: h=${ state.flip.horizontal } v=${ state.flip.vertical }` }
						</pre>
					</div>

					<div>
						<strong>Sizes</strong>
						<pre style={ { margin: '4px 0' } }>
							{ `container: ${ containerSize.width }×${
								containerSize.height
							}
element: ${ elementSize.width.toFixed( 0 ) }×${ elementSize.height.toFixed(
								0
							) }
visual: ${ visualSize.width.toFixed( 0 ) }×${ visualSize.height.toFixed(
								0
							) }` }
						</pre>
					</div>

					{ camera && (
						<div>
							<strong>Camera matrix</strong>
							<pre style={ { margin: '4px 0' } }>
								{ `[${ Array.from( camera )
									.map( ( v ) => v.toFixed( 2 ) )
									.join( ', ' ) }]` }
							</pre>
						</div>
					) }

					{ cropWorldCorners && (
						<div>
							<strong>Crop corners (world space)</strong>
							<pre style={ { margin: '4px 0' } }>
								{ `TL: (${ cropWorldCorners[ 0 ].x.toFixed(
									4
								) }, ${ cropWorldCorners[ 0 ].y.toFixed( 4 ) })
BR: (${ cropWorldCorners[ 1 ].x.toFixed(
									4
								) }, ${ cropWorldCorners[ 1 ].y.toFixed(
									4
								) })` }
							</pre>
							<span style={ { fontSize: 10, color: '#666' } }>
								Should be within [0,1] when contained
							</span>
						</div>
					) }

					{ restrictionResult && (
						<div>
							<strong>Restriction result</strong>
							<pre style={ { margin: '4px 0' } }>
								{ `zoom: ${ restrictionResult.zoom.toFixed(
									3
								) }
pan: (${ restrictionResult.pan.x.toFixed(
									4
								) }, ${ restrictionResult.pan.y.toFixed(
									4
								) })` }
							</pre>
						</div>
					) }

					{ sourceRegion && (
						<div>
							<strong>Source region (px)</strong>
							<pre style={ { margin: '4px 0' } }>
								{ `x: ${ sourceRegion.x.toFixed(
									0
								) }  y: ${ sourceRegion.y.toFixed( 0 ) }
w: ${ sourceRegion.width.toFixed( 0 ) }  h: ${ sourceRegion.height.toFixed(
									0
								) }` }
							</pre>
						</div>
					) }

					{ sourceRegion &&
						sourceRegion.width > 0 &&
						sourceRegion.height > 0 && (
							<div>
								<strong>Crop output</strong>
								<pre style={ { margin: '4px 0' } }>
									{ `dimensions: ${ Math.round(
										sourceRegion.width
									) }×${ Math.round( sourceRegion.height ) }
aspect ratio: ${ ( sourceRegion.width / sourceRegion.height ).toFixed( 2 ) }
% of original: ${ (
										( ( sourceRegion.width *
											sourceRegion.height ) /
											( imageSize.width *
												imageSize.height ) ) *
										100
									).toFixed( 1 ) }%` }
								</pre>
							</div>
						) }
				</div>
			</div>
		</div>
	);
};

export const Debug: Story = {
	render: DebugComponent,
};
