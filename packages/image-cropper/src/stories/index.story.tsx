import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import ImageCropper from '../components/image-cropper';
import ImageCropperProvider, { useImageCropper } from '../provider';
import type { ImageCropperProps } from '../types';
import { MIN_ZOOM, MAX_ZOOM } from '../constants';
import styles from './style.module.css';

export default {
	id: 'imagecropper-imagecropper',
	title: 'Editor/Image Cropper/ImageCropper',
	component: ImageCropper,
};

const DefaultComponent = ( args: ImageCropperProps ) => {
	return (
		<ImageCropperProvider>
			<div className={ styles[ 'container-wrapper' ] }>
				<div className={ styles.container }>
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
						label={ __( 'Aspect ratio' ) }
						hideLabelFromVision
						value={
							aspectRatioOptions.find(
								( item ) =>
									item.value ===
									cropperState.aspectRatio.toString()
							) ?? null
						}
						items={ aspectRatioOptions }
						onValueChange={ ( item ) => {
							if ( item && item.value !== null ) {
								handleAspectRatioChange( item.value );
							}
						} }
					/>
				</VStack>
				<HStack style={ { marginBottom: '20px' } } spacing={ 2 }>
					<button onClick={ reset }>{ __( 'Reset' ) }</button>
				</HStack>
			</VStack>

			<div className={ styles[ 'container-wrapper' ] }>
				<div className={ styles.container }>
					<ImageCropper { ...args } />
				</div>
			</div>
		</>
	);
};

export const WithControls = {
	parameters: {
		// FIXME: Crop controls include an unlabeled input and unnamed select (label, select-name).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
	render: WithControlsComponent,
	args: {
		src: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
		minZoom: 1,
		maxZoom: 5,
	},
};
