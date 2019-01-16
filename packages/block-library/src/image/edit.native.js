/**
 * External dependencies
 */
import React from 'react';
import { View, Image, TextInput, NativeEventEmitter } from 'react-native';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

const gutenbergBridgeEvents = new NativeEventEmitter( RNReactNativeGutenbergBridge );

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls } from '@wordpress/editor';
import { Toolbar, ToolbarButton, Spinner } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ImageSize from './image-size';
import { isURL } from '@wordpress/url'

const mediaUploadStateUploading = 1;
const mediaUploadStateSucceeded = 2;
const mediaUploadStateFailed = 3;

export default class ImageEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			progress: 0,
		};

		this.mediaUpload = this.mediaUpload.bind( this );
		this.addMediaUploadListener = this.addMediaUploadListener.bind( this );
		this.removeMediaUploadListener = this.removeMediaUploadListener.bind( this );
		this.finishMediaUploading = this.finishMediaUploading.bind( this );
	}

	mediaUpload( payload ) {
		if ( payload.state === mediaUploadStateUploading ) {
			this.setState( { progress: payload.progress } );
		} else if ( payload.state === mediaUploadStateSucceeded || payload.state === mediaUploadStateFailed ) {
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
		gutenbergBridgeEvents.addListener( 'mediaUpload' + mediaId, this.mediaUpload );
	}

	removeMediaUploadListener( mediaId ) {
		gutenbergBridgeEvents.removeListener( 'mediaUpload' + mediaId, this.mediaUpload );
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { url, caption, height, width } = attributes;

		const onMediaLibraryPressed = () => {
			RNReactNativeGutenbergBridge.onMediaLibraryPressed( ( mediaUrl ) => {
				if ( mediaUrl ) {
					setAttributes( { url: mediaUrl } );
				}
			} );
		};

		if ( ! url ) {
			const onUploadMediaPressed = () => {
				RNReactNativeGutenbergBridge.onUploadMediaPressed( ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						this.addMediaUploadListener( mediaId );
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			};

			return (
				<MediaPlaceholder
					onUploadMediaPressed={ onUploadMediaPressed }
					onMediaLibraryPressed={ onMediaLibraryPressed }
				/>
			);
		}

		const toolbarEditButton = (
			<Toolbar>
				<ToolbarButton
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ onMediaLibraryPressed }
				/>
			</Toolbar>
		);

		const showSpinner = ! isURL( url )
		const progress = this.state.progress * 100;
		const opacity = showSpinner ? 0.3 : 1;

		return (
			<View style={ { flex: 1 } }>
				{ showSpinner && <Spinner progress={ progress } /> }
				<BlockControls>
					{ toolbarEditButton }
				</BlockControls>
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
								<Image
									style={ { width: finalWidth, height: finalHeight, opacity: opacity } }
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
							placeholder={ __( 'Write caption…' )  }
							onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
						/>
					</View>
				) }
			</View>
		);
	}
}
