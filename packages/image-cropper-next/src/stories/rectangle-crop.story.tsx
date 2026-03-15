/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import {
	useState,
	useCallback,
	useEffect,
	useRef,
	useId,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Cropper } from '../components/cropper';
import { useCropperState } from '../hooks/use-cropper-state';
import type { TransformOperation } from '../core/types';
import { MIN_ZOOM, MAX_ZOOM } from '../core/constants';
import {
	loadImage,
	renderToCanvas,
	canvasToDataURL,
} from '../core/export/canvas-renderer';
import './style.css';

const SAMPLE_IMAGE = 'https://s.w.org/images/core/5.3/MtBlanc1.jpg';

const meta: Meta< typeof Cropper > = {
	title: 'ImageCropperNext/RectangleCrop',
	component: Cropper,
	tags: [ 'status-experimental' ],
};

export default meta;

type Story = StoryObj< typeof Cropper >;

/**
 * Default story. Basic cropper with a sample image, no controls.
 */
const DefaultComponent = () => {
	const { state, dispatch } = useCropperState();

	return (
		<div className="image-cropper-next-story__container">
			<Cropper
				src={ SAMPLE_IMAGE }
				state={ state }
				dispatch={ dispatch }
				showDimming
			/>
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
	const {
		state,
		dispatch,
		setRotation,
		setFlip,
		setZoom,
		setCropRect,
		reset,
	} = useCropperState();

	const [ aspectRatioValue, setAspectRatioValue ] = useState( '0' );

	const handleRotateLeft = useCallback( () => {
		setRotation( state.rotation - 90 );
	}, [ state.rotation, setRotation ] );

	const handleRotateRight = useCallback( () => {
		setRotation( state.rotation + 90 );
	}, [ state.rotation, setRotation ] );

	const handleRotationSlider = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			setRotation( parseFloat( event.target.value ) );
		},
		[ setRotation ]
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
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			setZoom( parseFloat( event.target.value ) );
		},
		[ setZoom ]
	);

	const handleAspectRatioChange = useCallback(
		( event: React.ChangeEvent< HTMLSelectElement > ) => {
			const value = event.target.value;
			setAspectRatioValue( value );

			const ratio = parseFloat( value );
			if ( ratio > 0 && state.image ) {
				// Adjust the crop rect to match the selected aspect ratio.
				// The crop rect is in visual-normalized space, so we need
				// the visual (rotation-dependent) aspect ratio, not the
				// natural one.
				const currentWidth = state.cropRect.width;
				const currentHeight = state.cropRect.height;
				const rad = ( state.rotation * Math.PI ) / 180;
				const cosR = Math.abs( Math.cos( rad ) );
				const sinR = Math.abs( Math.sin( rad ) );
				const natW = state.image.naturalWidth;
				const natH = state.image.naturalHeight;
				const visualW = cosR * natW + sinR * natH;
				const visualH = sinR * natW + cosR * natH;
				const visualAspect = visualW / visualH;
				const normalizedRatio = ratio / visualAspect;

				let newWidth = currentWidth;
				let newHeight = currentWidth / normalizedRatio;

				if ( newHeight > 1 ) {
					newHeight = currentHeight;
					newWidth = currentHeight * normalizedRatio;
				}

				newWidth = Math.min( newWidth, 1 );
				newHeight = Math.min( newHeight, 1 );

				setCropRect( {
					x: ( 1 - newWidth ) / 2,
					y: ( 1 - newHeight ) / 2,
					width: newWidth,
					height: newHeight,
				} );
			}
		},
		[ state.image, state.cropRect, state.rotation, setCropRect ]
	);

	const handleReset = useCallback( () => {
		reset();
		setAspectRatioValue( '0' );
	}, [ reset ] );

	return (
		<div>
			<div className="image-cropper-next-story__controls">
				<div className="image-cropper-next-story__row">
					<strong>Rotation: { state.rotation }deg</strong>
					<button onClick={ handleRotateLeft }>-90</button>
					<button onClick={ handleRotateRight }>+90</button>
					<input
						type="range"
						min="0"
						max="360"
						step="1"
						value={ state.rotation }
						onChange={ handleRotationSlider }
					/>
				</div>

				<div className="image-cropper-next-story__row">
					<strong>
						Flip: H={ state.flip.horizontal ? 'Yes' : 'No' }, V=
						{ state.flip.vertical ? 'Yes' : 'No' }
					</strong>
					<button onClick={ handleFlipHorizontal }>
						Flip Horizontal
					</button>
					<button onClick={ handleFlipVertical }>
						Flip Vertical
					</button>
				</div>

				<div className="image-cropper-next-story__row">
					<strong>Zoom: { state.zoom.toFixed( 2 ) }</strong>
					<input
						type="range"
						min={ MIN_ZOOM }
						max={ MAX_ZOOM }
						step="0.1"
						value={ state.zoom }
						onChange={ handleZoomChange }
					/>
				</div>

				<div className="image-cropper-next-story__row">
					<strong>Aspect Ratio:</strong>
					<select
						value={ aspectRatioValue }
						onChange={ handleAspectRatioChange }
					>
						<option value="0">Free</option>
						<option value="1">1:1 (Square)</option>
						<option value={ ( 16 / 9 ).toString() }>
							16:9 (Widescreen)
						</option>
						<option value={ ( 4 / 3 ).toString() }>
							4:3 (Standard)
						</option>
					</select>
				</div>

				<div className="image-cropper-next-story__row">
					<button onClick={ handleReset }>Reset</button>
				</div>
			</div>

			<div className="image-cropper-next-story__container">
				<Cropper
					src={ SAMPLE_IMAGE }
					state={ state }
					dispatch={ dispatch }
					showGrid
					showDimming
				/>
			</div>

			<div style={ { marginTop: 16 } }>
				<strong>Current State:</strong>
				<pre className="image-cropper-next-story__state">
					{ JSON.stringify(
						{
							rotation: state.rotation,
							zoom: state.zoom,
							cropRect: state.cropRect,
							crop: state.crop,
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
 * Cropper inside a resizable container to demonstrate responsiveness.
 */
const ResizableContainerComponent = () => {
	const { state, dispatch } = useCropperState();

	return (
		<div>
			<p>
				Drag the bottom-right corner of the container to resize it. The
				cropper adapts automatically.
			</p>
			<div className="image-cropper-next-story__resizable">
				<Cropper
					src={ SAMPLE_IMAGE }
					state={ state }
					dispatch={ dispatch }
					showDimming
					showGrid
				/>
			</div>
		</div>
	);
};

export const ResizableContainer: Story = {
	render: ResizableContainerComponent,
};

/**
 * Demonstrates the programmatic JSON API for AI-friendly transforms.
 */
const ProgrammaticAPIComponent = () => {
	const { state, dispatch, applyOperation, reset } = useCropperState();
	const opsJsonId = useId();

	const defaultOps = JSON.stringify(
		[
			{ type: 'rotate', degrees: 90 },
			{
				type: 'crop',
				rect: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
			},
		],
		null,
		2
	);

	const [ jsonInput, setJsonInput ] = useState( defaultOps );
	const [ error, setError ] = useState< string | null >( null );

	const handleApply = useCallback( () => {
		setError( null );

		try {
			const operations = JSON.parse( jsonInput ) as TransformOperation[];

			if ( ! Array.isArray( operations ) ) {
				setError( 'Input must be a JSON array of operations.' );
				return;
			}

			for ( const op of operations ) {
				applyOperation( op );
			}
		} catch ( err ) {
			setError(
				err instanceof Error ? err.message : 'Failed to parse JSON.'
			);
		}
	}, [ jsonInput, applyOperation ] );

	const handleReset = useCallback( () => {
		reset();
		setError( null );
	}, [ reset ] );

	return (
		<div>
			<div className="image-cropper-next-story__controls">
				<label htmlFor={ opsJsonId }>
					<strong>Transform Operations (JSON):</strong>
				</label>
				<textarea
					id={ opsJsonId }
					className="image-cropper-next-story__json"
					value={ jsonInput }
					onChange={ ( e ) => setJsonInput( e.target.value ) }
				/>
				<div className="image-cropper-next-story__row">
					<button onClick={ handleApply }>Apply</button>
					<button onClick={ handleReset }>Reset</button>
				</div>
				{ error && (
					<div style={ { color: 'red' } }>Error: { error }</div>
				) }
			</div>

			<div className="image-cropper-next-story__container">
				<Cropper
					src={ SAMPLE_IMAGE }
					state={ state }
					dispatch={ dispatch }
					showDimming
					showGrid
				/>
			</div>

			<div style={ { marginTop: 16 } }>
				<strong>Current State:</strong>
				<pre className="image-cropper-next-story__state">
					{ JSON.stringify( state, null, 2 ) }
				</pre>
			</div>
		</div>
	);
};

export const ProgrammaticAPI: Story = {
	render: ProgrammaticAPIComponent,
};

/**
 * Live crop preview showing the final export alongside the cropper.
 */
const WithPreviewComponent = () => {
	const { state, dispatch, setRotation, setFlip, setZoom, reset } =
		useCropperState();

	const [ previewSrc, setPreviewSrc ] = useState< string | null >( null );
	const imageRef = useRef< HTMLImageElement | null >( null );

	// Load the source image once.
	useEffect( () => {
		loadImage( SAMPLE_IMAGE ).then( ( img ) => {
			imageRef.current = img;
		} );
	}, [] );

	// Re-render the preview whenever state changes.
	useEffect( () => {
		if ( ! imageRef.current || ! state.image ) {
			return;
		}
		const canvas = renderToCanvas( imageRef.current, state );
		setPreviewSrc( canvasToDataURL( canvas, 'image/jpeg', 0.85 ) );
	}, [ state ] );

	const handleRotateLeft = useCallback( () => {
		setRotation( state.rotation - 90 );
	}, [ state.rotation, setRotation ] );

	const handleRotateRight = useCallback( () => {
		setRotation( state.rotation + 90 );
	}, [ state.rotation, setRotation ] );

	const handleRotationSlider = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			setRotation( parseFloat( event.target.value ) );
		},
		[ setRotation ]
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
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			setZoom( parseFloat( event.target.value ) );
		},
		[ setZoom ]
	);

	return (
		<div>
			<div className="image-cropper-next-story__controls">
				<div className="image-cropper-next-story__row">
					<strong>Rotation: { state.rotation }deg</strong>
					<button onClick={ handleRotateLeft }>-90</button>
					<button onClick={ handleRotateRight }>+90</button>
					<input
						type="range"
						min="0"
						max="360"
						step="1"
						value={ state.rotation }
						onChange={ handleRotationSlider }
					/>
				</div>

				<div className="image-cropper-next-story__row">
					<strong>
						Flip: H={ state.flip.horizontal ? 'Yes' : 'No' }, V=
						{ state.flip.vertical ? 'Yes' : 'No' }
					</strong>
					<button onClick={ handleFlipHorizontal }>
						Flip Horizontal
					</button>
					<button onClick={ handleFlipVertical }>
						Flip Vertical
					</button>
				</div>

				<div className="image-cropper-next-story__row">
					<strong>Zoom: { state.zoom.toFixed( 2 ) }</strong>
					<input
						type="range"
						min={ MIN_ZOOM }
						max={ MAX_ZOOM }
						step="0.1"
						value={ state.zoom }
						onChange={ handleZoomChange }
					/>
				</div>

				<div className="image-cropper-next-story__row">
					<button onClick={ () => reset() }>Reset</button>
				</div>
			</div>

			<div
				style={ { display: 'flex', gap: 24, alignItems: 'flex-start' } }
			>
				<div>
					<strong>Cropper</strong>
					<div className="image-cropper-next-story__container">
						<Cropper
							src={ SAMPLE_IMAGE }
							state={ state }
							dispatch={ dispatch }
							showGrid
							showDimming
						/>
					</div>
				</div>

				<div className="image-cropper-next-story__export-preview">
					<strong>Export Preview</strong>
					{ previewSrc ? (
						<img
							className="image-cropper-next-story__export-image"
							src={ previewSrc }
							alt="Crop preview"
						/>
					) : (
						<p>Loading...</p>
					) }
				</div>
			</div>
		</div>
	);
};

export const WithPreview: Story = {
	render: WithPreviewComponent,
};
