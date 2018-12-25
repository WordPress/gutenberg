/**
 * External dependencies
 */
import { View, Image, TextInput } from 'react-native';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls } from '@wordpress/editor';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class ImageEdit extends Component {

	constructor() {
		super( ...arguments );
		this.onMediaLibraryPress = this.onMediaLibraryPress.bind( this );
		this.onUploadPress = this.onUploadPress.bind( this );
		this.toolbarEditButton = this.toolbarEditButton.bind( this );
	}

	onUploadPress() {
		// This method should present an image picker from
		// the device.
		//TODO: Implement upload image method.
	};

	onMediaLibraryPress() {
		RNReactNativeGutenbergBridge.onMediaLibraryPress( ( mediaUrl ) => {
			if ( mediaUrl ) {
				this.props.setAttributes( { url: mediaUrl } );
			}
		} );
	};

	toolbarEditButton() {
		return (
			<Toolbar>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ this.onMediaLibraryPress }
				/>
			</Toolbar>
		);
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { url, caption } = attributes;

		if ( ! url ) {
			return (
				<MediaPlaceholder
					onUploadPress={ this.onUploadPress }
					onMediaLibraryPress={ this.onMediaLibraryPress }
				/>
			);
		}

		return (
			<View style={ { flex: 1 } }>
				<BlockControls>
					{ this.toolbarEditButton }
				</BlockControls>
				<Image
					style={ { width: '100%', height: 200 } }
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

export default ImageEdit;
