/**
 * External dependencies
 */
import React from 'react';
import { View, Image, TextInput, NativeEventEmitter } from 'react-native';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

const gutenbergBridgeEvents = new NativeEventEmitter( RNReactNativeGutenbergBridge )

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls } from '@wordpress/editor';
import { Toolbar, ToolbarButton, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default class ImageEdit extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			progress: 0
		};

		this.mediaUpload = this.mediaUpload.bind( this );
		this.addMediaUploadListener = this.addMediaUploadListener.bind( this );
		this.removeMediaUploadListener = this.removeMediaUploadListener.bind( this );
		this.finishMediaUploading = this.finishMediaUploading.bind( this );
	}

	mediaUpload ( payload ) {
		
		if ( payload.state == 1 ) {
			this.setState( { progress: payload.progress } );
		}
		else if ( payload.state === 2 || payload.state == 3) {
			this.finishMediaUploading( payload );
		}
	} 

	finishMediaUploading( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { url: payload.mediaUrl, id: payload.mediaId } );
		this.setState( { progress: payload.progress } );
		this.removeMediaUploadListener( payload.mediaId );
	}

	addMediaUploadListener( mediaId ) {
		gutenbergBridgeEvents.addListener( 'mediaUpload'+ mediaId, this.mediaUpload );
	}

	removeMediaUploadListener( mediaId ) {
		gutenbergBridgeEvents.removeListener( 'mediaUpload'+ mediaId, this.mediaUpload );
	}

	render() {

		const { attributes, isSelected, setAttributes } = this.props;
		const { url, id, caption } = attributes;

		const onMediaLibraryPress = () => {
			RNReactNativeGutenbergBridge.onMediaLibraryPress( ( mediaUrl ) => {
				if ( mediaUrl ) {
					setAttributes( { url: mediaUrl } );
				}
			} );
		};

		if ( ! url ) {

			const onUploadMediaPress = () => {
				RNReactNativeGutenbergBridge.onUploadMediaPress( ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						
						this.addMediaUploadListener( mediaId )
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			};

			return (
				<MediaPlaceholder
					onUploadMediaPress={ onUploadMediaPress }
					onMediaLibraryPress={ onMediaLibraryPress }
				/>
			);
		}

		const toolbarEditButton = (
			<Toolbar>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ onMediaLibraryPress }
				/>
			</Toolbar>
		);
		
		const http = 'http';
		const showSpinner = url !== undefined ? ! url.includes(http) : false;
		const progress = this.state.progress * 100;
		const opacity = showSpinner ? 0.3 : 1;

		return (
			<View style={ { flex: 1 } }>

				{showSpinner && <Spinner progress={ progress }/>}
				<BlockControls>
					{ toolbarEditButton }
				</BlockControls>
				<Image
					style={ { width: '100%', height: 200, opacity: opacity } }
					resizeMethod="scale"
					source={ { uri: url } }
				/>
				{ ( ! RichText.isEmpty( caption ) > 0 || isSelected ) && (
					<View style={ { padding: 12, flex: 1 } }>
						<TextInput
							style={ { textAlign: 'center' } }
							underlineColorAndroid="transparent"
							value={ caption }
							placeholder={ 'Write caption…' }
							onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
						/>
					</View>
				) }
			</View>
		);
	}
}