/**
 * External dependencies
 */
import React from 'react';
import { View, Image, TextInput, NativeEventEmitter } from 'react-native';
import {
	subscribeMediaUpload,
	onMediaLibraryPressed,
	onUploadMediaPressed,
} from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls } from '@wordpress/editor';
import { Toolbar, ToolbarButton, Spinner } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ImageSize from './image-size';
import { isURL } from '@wordpress/url'

const MEDIA_ULOAD_STATE_UPLOADING = 1;
const MEDIA_ULOAD_STATE_SUCCEEDED = 2;
const MEDIA_ULOAD_STATE_FAILED = 3;

export default class ImageEdit extends React.Component {

	subscriptionParentMediaUpload: ?EmitterSubscription;

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

	componentWillUnmount() {
		this.removeMediaUploadListener();
	}

	mediaUpload( payload ) {
		const { attributes } = this.props;

		if (payload.mediaId === attributes.id) {
			if ( payload.state === MEDIA_ULOAD_STATE_UPLOADING ) {
				this.setState( { progress: payload.progress } );
			} else if ( payload.state === MEDIA_ULOAD_STATE_SUCCEEDED || payload.state === MEDIA_ULOAD_STATE_FAILED ) {
				this.finishMediaUploading( payload );
			}	
		}
	}

	finishMediaUploading( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { url: payload.mediaUrl, id: payload.mediaId } );
		this.removeMediaUploadListener( payload.mediaId );
	}

	addMediaUploadListener( ) {
		this.subscriptionParentMediaUpload = subscribeMediaUpload( ( payload ) => {
			this.mediaUpload( payload );
		} );
	}

	removeMediaUploadListener( ) {
		if ( this.subscriptionParentMediaUpload ) {
			this.subscriptionParentMediaUpload.remove();
		}
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { url, caption, height, width } = attributes;

		const onMediaLibraryButtonPressed = () => {
			onMediaLibraryPressed( ( mediaUrl ) => {
				if ( mediaUrl ) {
					setAttributes( { url: mediaUrl } );
				}
			} );
		};

		if ( ! url ) {
			const onUploadMediaButtonPressed = () => {
				onUploadMediaPressed( ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						this.addMediaUploadListener( mediaId );
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			};

			return (
				<MediaPlaceholder
					onUploadMediaPressed={ onUploadMediaButtonPressed }
					onMediaLibraryPressed={ onMediaLibraryButtonPressed }
				/>
			);
		}

		const toolbarEditButton = (
			<Toolbar>
				<ToolbarButton
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ onMediaLibraryButtonPressed }
				/>
			</Toolbar>
		);

		const showSpinner = ! isURL( url )
		const opacity = ! isURL( url ) ? 0.3 : 1;
		const progress = this.state.progress * 100;

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
