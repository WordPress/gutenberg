/**
 * External dependencies
 */
import Compressor from 'compressorjs';

/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useRef,
	useLayoutEffect,
} from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';
import {
	Modal,
	Button,
	RangeControl,
	FlexItem,
	BaseControl,
	__experimentalText as Text,
	__experimentalUnitControl as UnitControl,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { percent } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
// TODO: move the hook to a different file.. Could be done in a follow up, or extracted before.
import useDebouncedInput from '../inserter/hooks/use-debounced-input';
import { store as blockEditorStore } from '../../store';

const EMPTY_ARRAY = [];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

// Helper function to convert bytes to human readable format.
function humanReadableFileSize( fileSize ) {
	if ( ! fileSize ) return;
	const units = [ 'B', 'kB', 'MB', 'GB' ];
	const unitExponent = Math.floor( Math.log( fileSize ) / Math.log( 1024 ) );
	return `${ ( fileSize / Math.pow( 1024, unitExponent ) ).toFixed( 2 ) }${
		units[ unitExponent ]
	}`;
}

// TODO: probably make private..
export default function CompressMedia( { image, onUploadImage } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	if ( ! image ) {
		return null;
	}
	return (
		<>
			{ /* TODO: probably make the whole row a Button  */ }
			<VStack>
				<Heading level={ 2 }>{ __( 'Compress image' ) }</Heading>
				<HStack
					justify="space-between"
					className="compress-image_container"
				>
					<HStack justify="flex-start">
						<img
							className="compress-image__thumbnail"
							alt={ image.alt_text }
							src={ image.source_url }
						/>
						<Text limit={ 10 } truncate>
							{ image.title?.rendered || image.title }
						</Text>
					</HStack>
					<HStack justify="flex-end">
						<span>{ humanReadableFileSize( image.filesize ) }</span>
						<Button
							label={ __( 'Compress attachments' ) }
							onClick={ () => setIsModalOpen( true ) }
							// TODO: create a new icon for this..
							icon={ percent }
						/>
					</HStack>
				</HStack>
			</VStack>
			{ isModalOpen && (
				<CompressMediaModal
					image={ image }
					onClose={ () => setIsModalOpen( false ) }
					onUploadImage={ onUploadImage }
				/>
			) }
		</>
	);
}

function CompressMediaModal( { image, onClose, onUploadImage } ) {
	const [ uncompressedMediaBlob, setUncompressedMediaBlob ] =
		useState( null );
	// We need to fetch the uncompressed media blob to be able to compress it.
	const uncompressedSourceUrl =
		image?.uncompressed_source_url || image?.source_url;
	useEffect( () => {
		if ( ! uncompressedSourceUrl ) {
			return;
		}
		window
			.fetch( uncompressedSourceUrl )
			.then( ( result ) => result.blob() )
			.then( setUncompressedMediaBlob );
	}, [ uncompressedSourceUrl ] );
	// TODO: get from preferences and default to 82 or something..
	// TODO: store number in post meta and make proper conversions where needed..
	const [ quality, setQuality, debouncedQuality ] = useDebouncedInput(
		`${ image.meta?._wp_compression_factor || 80 }%`
	);
	const [ isUploading, setIsUploading ] = useState( false );
	const [ currentTempConversion, setCurrentTempConversion ] =
		useState( null );
	// TODO: handle the existing conversions...
	// Init temp conversions maybe with existing converted images...
	const tempConversions = useRef( new Map() );
	const mediaUpload = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	// We are using an effect to update the current compressed media
	// because we debounce the quality input to avoid many unneeded.
	// compressions. The media compression happens client side and we
	// upload the compressed version.
	useEffect( () => {
		if ( ! uncompressedMediaBlob ) {
			return;
		}
		const _quality = parseInt( debouncedQuality );
		if ( tempConversions.current.has( _quality ) ) {
			setCurrentTempConversion( tempConversions.current.get( _quality ) );
			return;
		}
		// TODO: there is no check right now for existing uploaded compressed versions.
		// We should either have these info and avoid uploading an image with the same
		// compression factor, or try to handle it PHP before inserting the attachment.
		// If we go the PHP route, it's connected with the question about what to do with
		// the rest attachment fields like title, caption, etc..
		new Compressor( uncompressedMediaBlob, {
			quality: _quality / 100,
			// The compression process is asynchronous, which means the
			// `result` can be accessed in the `success` hook function.
			success( result ) {
				const formData = new FormData();
				formData.append( 'file', result, result.name );
				setCurrentTempConversion( result );
				tempConversions.current.set( _quality, result );
			},
			error( error ) {
				createErrorNotice( error?.message, { type: 'snackbar' } );
			},
		} );
	}, [ createErrorNotice, debouncedQuality, uncompressedMediaBlob ] );
	async function uploadImage() {
		if ( ! currentTempConversion ) {
			return;
		}
		// TODO: How to handle the original image's data?
		// Should we copy some values like now(title, caption, etc..) from it
		// and keep them decoupled in that aspect?
		// If we want to sync these data it should prabably be done in REST layer
		// when preparing the response..
		setIsUploading( true );
		mediaUpload( {
			filesList: [ currentTempConversion ],
			additionalData: {
				// TODO: check if we can ever have the `raw` value. Probably not in `view` context,
				// but check the original request in Image block.
				title: image.title?.raw || image.title?.rendered || '',
				alt_text: image.alt_text,
				caption: image.caption?.raw || image.caption?.rendered || '',
				description:
					image.description?.raw || image.description?.rendered || '',
				_wp_compression_factor: parseInt( quality ) || 0,
				_wp_uncompressed_media_id:
					image.meta._wp_uncompressed_media_id || image.id || 0,
				// TODO: ideally we should pass the meta values in the REST API
				// and not handle the update in gutenberg_rest_after_insert_attachment_update_meta.
				// meta: {
				// 	_wp_compression_factor: parseInt( quality ) || 0,
				// 	_wp_uncompressed_media_id:
				// 		image.meta._wp_uncompressed_media_id || image.id || 0,
				// },
			},
			onFileChange( [ img ] ) {
				if ( isBlobURL( img?.url ) ) {
					return;
				}
				onUploadImage( img );
				onClose();
				createSuccessNotice( __( 'Image compressed and replaced.' ), {
					type: 'snackbar',
				} );
			},
			allowedTypes: ALLOWED_MEDIA_TYPES,
			onError( message ) {
				createErrorNotice( message, { type: 'snackbar' } );
				setIsUploading( false );
			},
		} );
	}
	return (
		<Modal title={ __( 'Compress image' ) } onRequestClose={ onClose }>
			<VStack spacing={ 2 }>
				{ currentTempConversion && (
					<>
						{ !! image.meta?._wp_compression_factor && (
							<Text>
								{ sprintf(
									/* translators: %s: compression factor of media. */
									__( 'Current image quality is: %s' ),
									`${ image.meta._wp_compression_factor }%`
								) }
							</Text>
						) }
						<HStack>
							<Text>
								{ sprintf(
									/* translators: %s: compressed file size. */
									__( 'Compressed: %s' ),
									humanReadableFileSize(
										currentTempConversion.size
									)
								) }
							</Text>
							<Text>
								{ sprintf(
									/* translators: %s: uncompressed file size. */
									__( 'Original: %s' ),
									humanReadableFileSize(
										uncompressedMediaBlob.size
									)
								) }
							</Text>
						</HStack>
						<CompareImagesSlider
							first={ window.URL.createObjectURL(
								currentTempConversion
							) }
							second={ uncompressedSourceUrl }
						/>
					</>
				) }
				<fieldset className="components-border-radius-control">
					<BaseControl.VisualLabel as="legend">
						{ __( 'Quality' ) }
					</BaseControl.VisualLabel>
					<HStack spacing={ 4 }>
						<UnitControl
							label={ __( 'Quality' ) }
							hideLabelFromVision
							min={ 1 }
							max={ 100 }
							onChange={ ( _value ) => {
								setQuality( _value );
							} }
							value={ quality }
							size="__unstable-large"
							units={ EMPTY_ARRAY }
						/>
						<FlexItem isBlock>
							<RangeControl
								__next40pxDefaultSize
								label={ __( 'Quality' ) }
								hideLabelFromVision
								min={ 1 }
								max={ 100 }
								value={ parseInt( quality ) }
								onChange={ ( _value ) => {
									setQuality( `${ _value }%` );
								} }
								withInputField={ false }
							/>
						</FlexItem>
					</HStack>
					<p>
						{ __(
							'Lower quality results in smaller file size and faster page load speed.'
						) }
					</p>
				</fieldset>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ onClose }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ uploadImage }
						disabled={ isUploading || parseInt( quality ) === 100 }
					>
						{ __( 'Compress' ) }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}

function CompareImagesSlider( { first, second } ) {
	const overlayRef = useRef();
	const firstImageRef = useRef();
	const secondImageRef = useRef();
	const handleRef = useRef();
	const rangeRef = useRef();
	const [ rangeValue, setRangeValue ] = useState( 50 );
	useLayoutEffect( () => {
		if ( ! rangeRef.current?.offsetWidth ) {
			return;
		}
		firstImageRef.current.style.width = `${ rangeRef.current.offsetWidth }px`;
		secondImageRef.current.style.width = `${ rangeRef.current.offsetWidth }px`;
	}, [ rangeRef.current?.offsetWidth ] );
	return (
		<div className="block-editor-compare-images-slider__container">
			<div
				className="block-editor-compare-images-slider__top-image"
				ref={ overlayRef }
			>
				<img
					src={ first }
					className="block-editor-compare-images-slider_image"
					ref={ firstImageRef }
					alt=""
				/>
			</div>
			<img
				src={ second }
				className="block-editor-compare-images-slider_image"
				ref={ secondImageRef }
				alt=""
			/>
			<div
				className="block-editor-compare-images-slider__handle"
				ref={ handleRef }
			></div>
			<input
				className="block-editor-compare-images-slider__range"
				type="range"
				min="0"
				max="100"
				value={ rangeValue }
				onChange={ ( event ) => {
					const newValue = event.target.value;
					setRangeValue( newValue );
					if ( newValue ) {
						overlayRef.current.style.width = newValue + '%';
						handleRef.current.style.left = newValue + '%';
					} else {
						overlayRef.current.style.width = 'calc(0% + 5px)';
						handleRef.current.style.left = 'calc(0% + 5px)';
					}
				} }
				ref={ rangeRef }
			/>
		</div>
	);
}
