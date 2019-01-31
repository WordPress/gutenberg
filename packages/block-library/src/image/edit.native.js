/**
 * External dependencies
 */
import React from 'react';
import { View, Image, TextInput, Text, TouchableOpacity, Switch } from 'react-native';
import {
	subscribeMediaUpload,
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	mediaUploadSync,
} from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls, InspectorControls, BottomSheet } from '@wordpress/editor';
import { Toolbar, ToolbarButton, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ImageSize from './image-size';
import { isURL } from '@wordpress/url';
import inspectorStyles from './inspector-styles.scss';

const MEDIA_ULOAD_STATE_UPLOADING = 1;
const MEDIA_ULOAD_STATE_SUCCEEDED = 2;
const MEDIA_ULOAD_STATE_FAILED = 3;

export default class ImageEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			progress: 0,
			isUploadInProgress: false,
			showSettings: false,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
		this.addMediaUploadListener = this.addMediaUploadListener.bind( this );
		this.removeMediaUploadListener = this.removeMediaUploadListener.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
	}

	componentDidMount() {
		const { attributes } = this.props;

		if ( attributes.id && ! isURL( attributes.url ) ) {
			this.addMediaUploadListener();
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		this.removeMediaUploadListener();
	}

	mediaUpload( payload ) {
		const { attributes } = this.props;

		if ( payload.mediaId !== attributes.id ) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_ULOAD_STATE_UPLOADING:
				this.setState( { progress: payload.progress, isUploadInProgress: true } );
				break;
			case MEDIA_ULOAD_STATE_SUCCEEDED:
				this.finishMediaUploadWithSuccess( payload );
				break;
			case MEDIA_ULOAD_STATE_FAILED:
				this.finishMediaUploadWithFailure( payload );
				break;
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { url: payload.mediaUrl, id: payload.mediaServerId } );
		this.setState( { isUploadInProgress: false } );

		this.removeMediaUploadListener();
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { url: payload.mediaUrl, id: payload.mediaId } );
		this.setState( { isUploadInProgress: false } );

		this.removeMediaUploadListener();
	}

	addMediaUploadListener() {
		this.subscriptionParentMediaUpload = subscribeMediaUpload( ( payload ) => {
			this.mediaUpload( payload );
		} );
	}

	removeMediaUploadListener() {
		if ( this.subscriptionParentMediaUpload ) {
			this.subscriptionParentMediaUpload.remove();
		}
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { url, caption, height, width } = attributes;

		const onMediaLibraryButtonPressed = () => {
			requestMediaPickFromMediaLibrary( ( mediaId, mediaUrl ) => {
				if ( mediaUrl ) {
					setAttributes( { id: mediaId, url: mediaUrl } );
				}
			} );
		};

		if ( ! url ) {
			const onMediaUploadButtonPressed = () => {
				requestMediaPickFromDeviceLibrary( ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						this.addMediaUploadListener( );
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			};

			const onMediaCaptureButtonPressed = () => {
				requestMediaPickFromDeviceCamera( ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						this.addMediaUploadListener( );
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			};

			return (
				<MediaPlaceholder
					onUploadMediaPressed={ onMediaUploadButtonPressed }
					onMediaLibraryPressed={ onMediaLibraryButtonPressed }
					onCapturePhotoPressed={ onMediaCaptureButtonPressed }
				/>
			);
		}

		const onImageSettingsButtonPressed = () => {
			this.setState( { showSettings: true } );
		};

		const onImageSettingsClose = () => {
			this.setState( { showSettings: false } );
		};

		const toolbarEditButton = (
			<Toolbar>
				<ToolbarButton
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ onMediaLibraryButtonPressed }
				/>
			</Toolbar>
		);

		const getInspectorControls = () => (
			<BottomSheet
				isVisible={ this.state.showSettings }
				title={ __( 'Image Settings' ) }
				onClose={ onImageSettingsClose }
				rightButton={ 
					<BottomSheet.Button
						text={ __( 'Done' ) }
						color={ '#0087be' }
						onPress={ onImageSettingsClose }
					/> 
				}
			>
				<TouchableOpacity style={ inspectorStyles.bottomSheetCell } onPress={ () => { } }>
					<Text style={ inspectorStyles.bottomSheetCellLabel }>{ __( 'Alt Text' ) }</Text>
					<Text style={ inspectorStyles.bottomSheetCellValue }>{ __( 'None' ) }</Text>
				</TouchableOpacity>
			</BottomSheet>
		);

		const showSpinner = this.state.isUploadInProgress;
		const opacity = this.state.isUploadInProgress ? 0.3 : 1;
		const progress = this.state.progress * 100;

		return (
			<View style={ { flex: 1 } }>
				{ showSpinner && <Spinner progress={ progress } /> }
				<BlockControls>
					{ toolbarEditButton }
				</BlockControls>
				<InspectorControls>
					<ToolbarButton
						label={ __( 'Image Settings' ) }
						icon="admin-generic"
						onClick={ onImageSettingsButtonPressed }
					/>
				</InspectorControls>
				<ImageSize src={ url } >
					{ ( sizes ) => {
						const {
							imageWidthWithinContainer,
							imageHeightWithinContainer,
						} = sizes;

						let finalHeight = imageHeightWithinContainer;
						if ( height > 0 && height < imageHeightWithinContainer ) {
							finalHeight = height;
						}

						let finalWidth = imageWidthWithinContainer;
						if ( width > 0 && width < imageWidthWithinContainer ) {
							finalWidth = width;
						}

						return (
							<View style={ { flex: 1 } } >
								{ getInspectorControls() }
								<Image
									style={ { width: finalWidth, height: finalHeight, opacity } }
									resizeMethod="scale"
									source={ { uri: url } }
									key={ url }
								/>
							</View>
						);
					} }
				</ImageSize>
				{ ( ! RichText.isEmpty( caption ) > 0 || isSelected ) && (
					<View style={ { padding: 12, flex: 1 } }>
						<TextInput
							style={ { textAlign: 'center' } }
							underlineColorAndroid="transparent"
							value={ caption }
							placeholder={ __( 'Write caption…' ) }
							onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
						/>
					</View>
				) }
			</View>
		);
	}
}
