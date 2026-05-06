/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	Button,
	Disabled,
	SelectControl,
	Spinner,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { Icon, audio as icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Path, SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import {
	useUploadMediaFromBlobURL,
	useToolsPanelDropdownMenuProps,
} from '../utils/hooks';
import { Caption } from '../utils/caption';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

function AudioEdit( {
	attributes,
	className,
	setAttributes,
	onReplace,
	isSelected: isSingleSelected,
	insertBlocksAfter,
} ) {
	const { id, autoplay, loop, preload, src } = attributes;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const [ isRecording, setIsRecording ] = useState( false );
	const [ isPreparingRecording, setIsPreparingRecording ] = useState( false );
	const recorderRef = useRef();
	const streamRef = useRef();
	const chunksRef = useRef( [] );
	const blockEditingMode = useBlockEditingMode();
	const hasNonContentControls = blockEditingMode === 'default';
	const isMediaRecorderSupported =
		typeof window !== 'undefined' &&
		typeof window.MediaRecorder !== 'undefined' &&
		!! window.navigator?.mediaDevices?.getUserMedia;

	useUploadMediaFromBlobURL( {
		url: temporaryURL,
		allowedTypes: ALLOWED_MEDIA_TYPES,
		onChange: onSelectAudio,
		onError: onUploadError,
	} );

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	function onSelectURL( newSrc ) {
		// Set the block's src from the edit component's state, and switch off
		// the editing UI.
		if ( newSrc !== src ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url: newSrc },
			} );
			if ( undefined !== embedBlock && onReplace ) {
				onReplace( embedBlock );
				return;
			}
			setAttributes( { src: newSrc, id: undefined, blob: undefined } );
			setTemporaryURL();
		}
	}

	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	function stopRecorderStream() {
		streamRef.current?.getTracks()?.forEach( ( track ) => track.stop() );
		streamRef.current = undefined;
	}

	function getSupportedMimeType() {
		const preferredMimeTypes = [
			'audio/webm;codecs=opus',
			'audio/ogg;codecs=opus',
			'audio/webm',
			'audio/ogg',
		];
		return preferredMimeTypes.find( ( type ) =>
			window.MediaRecorder.isTypeSupported( type )
		);
	}

	async function startRecording() {
		if (
			! isMediaRecorderSupported ||
			isPreparingRecording ||
			isRecording
		) {
			return;
		}

		try {
			setIsPreparingRecording( true );
			const stream = await window.navigator.mediaDevices.getUserMedia( {
				audio: true,
			} );
			streamRef.current = stream;
			chunksRef.current = [];
			const mimeType = getSupportedMimeType();
			const recorder = mimeType
				? new window.MediaRecorder( stream, { mimeType } )
				: new window.MediaRecorder( stream );

			recorder.ondataavailable = ( event ) => {
				if ( event.data?.size ) {
					chunksRef.current.push( event.data );
				}
			};

			recorder.onstop = () => {
				const blob = new window.Blob( chunksRef.current, {
					type:
						mimeType ||
						recorder.mimeType ||
						'audio/webm;codecs=opus',
				} );
				chunksRef.current = [];
				onSelectAudio( { url: window.URL.createObjectURL( blob ) } );
				stopRecorderStream();
				setIsRecording( false );
				recorderRef.current = undefined;
			};

			recorder.start();
			recorderRef.current = recorder;
			setIsRecording( true );
		} catch ( error ) {
			onUploadError(
				error?.message || __( 'Could not access microphone.' )
			);
			stopRecorderStream();
		} finally {
			setIsPreparingRecording( false );
		}
	}

	function stopRecording() {
		if ( recorderRef.current?.state === 'recording' ) {
			recorderRef.current.stop();
		}
	}

	useEffect( () => {
		return () => {
			if ( recorderRef.current?.state === 'recording' ) {
				recorderRef.current.stop();
			}
			stopRecorderStream();
		};
	}, [] );

	function getAutoplayHelp( checked ) {
		return checked
			? __( 'Autoplay may cause usability issues for some users.' )
			: null;
	}

	function onSelectAudio( media ) {
		if ( ! media || ! media.url ) {
			// In this case there was an error and we should continue in the editing state
			// previous attributes should be removed because they may be temporary blob urls.
			setAttributes( {
				src: undefined,
				id: undefined,
				caption: undefined,
				blob: undefined,
			} );
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		// Sets the block's attribute and updates the edit component from the
		// selected media, then switches off the editing UI.
		setAttributes( {
			blob: undefined,
			src: media.url,
			id: media.id,
			caption: media.caption,
		} );
		setTemporaryURL();
	}

	const classes = clsx( className, {
		'is-transient': !! temporaryURL,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const recordingIcon = (
		<SVG viewBox="0 0 24 24">
			<Path
				fill="#d63638"
				d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Z"
			/>
		</SVG>
	);

	if ( ! src && ! temporaryURL ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					onSelect={ onSelectAudio }
					onSelectURL={ onSelectURL }
					accept="audio/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					onError={ onUploadError }
				>
					{ isMediaRecorderSupported && (
						<Button
							__next40pxDefaultSize
							className="block-editor-media-placeholder__button"
							variant="secondary"
							onClick={
								isRecording ? stopRecording : startRecording
							}
							disabled={ isPreparingRecording }
							accessibleWhenDisabled
							icon={
								isRecording ? (
									<Icon icon={ recordingIcon } />
								) : null
							}
							tooltip={
								isRecording ? __( 'Preparing to record…' ) : ''
							}
						>
							{ isRecording
								? __( 'Stop recording' )
								: _x( 'Record', 'verb' ) }
						</Button>
					) }
				</MediaPlaceholder>
			</div>
		);
	}

	return (
		<>
			{ isSingleSelected && (
				<BlockControls group="other">
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ src }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="audio/*"
						onSelect={ onSelectAudio }
						onSelectURL={ onSelectURL }
						onError={ onUploadError }
						onReset={ () => onSelectAudio( undefined ) }
						variant="toolbar"
					/>
				</BlockControls>
			) }
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							autoplay: false,
							loop: false,
							preload: undefined,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Autoplay' ) }
						isShownByDefault
						hasValue={ () => !! autoplay }
						onDeselect={ () =>
							setAttributes( {
								autoplay: false,
							} )
						}
					>
						<ToggleControl
							label={ __( 'Autoplay' ) }
							onChange={ toggleAttribute( 'autoplay' ) }
							checked={ !! autoplay }
							help={ getAutoplayHelp }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Loop' ) }
						isShownByDefault
						hasValue={ () => !! loop }
						onDeselect={ () =>
							setAttributes( {
								loop: false,
							} )
						}
					>
						<ToggleControl
							label={ __( 'Loop' ) }
							onChange={ toggleAttribute( 'loop' ) }
							checked={ !! loop }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Preload' ) }
						isShownByDefault
						hasValue={ () => !! preload }
						onDeselect={ () =>
							setAttributes( {
								preload: undefined,
							} )
						}
					>
						<SelectControl
							__next40pxDefaultSize
							label={ _x(
								'Preload',
								'noun; Audio block parameter'
							) }
							value={ preload || '' }
							// `undefined` is required for the preload attribute to be unset.
							onChange={ ( value ) =>
								setAttributes( {
									preload: value || undefined,
								} )
							}
							options={ [
								{ value: '', label: __( 'Browser default' ) },
								{ value: 'auto', label: __( 'Auto' ) },
								{ value: 'metadata', label: __( 'Metadata' ) },
								{
									value: 'none',
									label: _x( 'None', 'Preload value' ),
								},
							] }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<figure { ...blockProps }>
				{ /*
				Disable the audio tag if the block is not selected
				so the user clicking on it won't play the
				file or change the position slider when the controls are enabled.
				*/ }
				<Disabled isDisabled={ ! isSingleSelected }>
					<audio controls="controls" src={ src ?? temporaryURL } />
				</Disabled>
				{ !! temporaryURL && <Spinner /> }
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSingleSelected }
					insertBlocksAfter={ insertBlocksAfter }
					label={ __( 'Audio caption text' ) }
					showToolbarButton={
						isSingleSelected && hasNonContentControls
					}
				/>
			</figure>
		</>
	);
}

export default AudioEdit;
