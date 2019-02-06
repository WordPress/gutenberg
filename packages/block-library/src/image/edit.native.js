/**
 * External dependencies
 */
import React from 'react';
import { View, ImageBackground, TextInput, Text, TouchableWithoutFeedback } from 'react-native';
import {
	subscribeMediaUpload,
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls, InspectorControls, BottomSheet } from '@wordpress/editor';
import { Toolbar, ToolbarButton, Spinner, Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ImageSize from './image-size';
import { isURL } from '@wordpress/url';
import styles from './styles.scss';

const MEDIA_UPLOAD_STATE_UPLOADING = 1;
const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
const MEDIA_UPLOAD_STATE_FAILED = 3;
const MEDIA_UPLOAD_STATE_RESET = 4;

const LINK_DESTINATION_CUSTOM = 'custom';

export default class ImageEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			showSettings: false,
			progress: 0,
			isUploadInProgress: false,
			isUploadFailed: false,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
		this.addMediaUploadListener = this.addMediaUploadListener.bind( this );
		this.removeMediaUploadListener = this.removeMediaUploadListener.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.updateAlt = this.updateAlt.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
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

	onImagePressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if ( attributes.id && ! isURL( attributes.url ) ) {
			requestImageFailedRetryDialog( attributes.id );
		}
	}

	mediaUpload( payload ) {
		const { attributes } = this.props;

		if ( payload.mediaId !== attributes.id ) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				this.setState( { progress: payload.progress, isUploadInProgress: true, isUploadFailed: false } );
				break;
			case MEDIA_UPLOAD_STATE_SUCCEEDED:
				this.finishMediaUploadWithSuccess( payload );
				break;
			case MEDIA_UPLOAD_STATE_FAILED:
				this.finishMediaUploadWithFailure( payload );
				break;
			case MEDIA_UPLOAD_STATE_RESET:
				this.mediaUploadStateReset( payload );
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

		setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false, isUploadFailed: true } );
	}

	mediaUploadStateReset( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { id: payload.mediaId, url: null } );
		this.setState( { isUploadInProgress: false, isUploadFailed: false } );
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

	updateAlt( newAlt ) {
		this.props.setAttributes( { alt: newAlt } );
	}

	onSetLinkDestination( href ) {
		this.props.setAttributes( {
			linkDestination: LINK_DESTINATION_CUSTOM,
			href,
		} );
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { url, caption, height, width, alt, href } = attributes;

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
				onClose={ onImageSettingsClose }
				hideHeader
			>
				<BottomSheet.Cell
					icon={ 'admin-links' }
					label={ __( 'Link To' ) }
					value={ href || '' }
					valuePlaceholder={ __( 'Add URL' ) }
					onChangeValue={ this.onSetLinkDestination }
					autoCapitalize="none"
					autoCorrect={ false }
				/>
				<BottomSheet.Cell
					icon={ 'editor-textcolor' }
					label={ __( 'Alt Text' ) }
					value={ alt || '' }
					valuePlaceholder={ __( 'None' ) }
					onChangeValue={ this.updateAlt }
				/>
				<BottomSheet.Cell
					label={ __( 'Reset to Original' ) }
					labelStyle={ styles.resetSettingsButton }
					drawSeparator={ false }
					onPress={ () => {} }
				/>
			</BottomSheet>
		);

		const showSpinner = this.state.isUploadInProgress;
		const opacity = this.state.isUploadInProgress ? 0.3 : 1;
		const progress = this.state.progress * 100;

		return (
			<TouchableWithoutFeedback onPress={ this.onImagePressed } disabled={ ! isSelected }>
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
									<ImageBackground
										style={ { width: finalWidth, height: finalHeight, opacity } }
										resizeMethod="scale"
										source={ { uri: url } }
										key={ url }
									>
										{ this.state.isUploadFailed &&
											<View style={ styles.imageContainer } >
												<Dashicon icon={ 'image-rotate' } ariaPressed={ 'dashicon-active' } />
												<Text style={ styles.uploadFailedText }>{ __( 'Failed to insert media.\nPlease tap for options.' ) }</Text>
											</View>
										}
									</ImageBackground>
								</View>
							);
						} }
					</ImageSize>
					{ ( ! RichText.isEmpty( caption ) > 0 || isSelected ) && (
						<View style={ { padding: 12, flex: 1 } }>
							<TextInput
								style={ { textAlign: 'center' } }
								fontFamily={ this.props.fontFamily || ( styles[ 'caption-text' ].fontFamily ) }
								underlineColorAndroid="transparent"
								value={ caption }
								placeholder={ __( 'Write caption…' ) }
								onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
							/>
						</View>
					) }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}
