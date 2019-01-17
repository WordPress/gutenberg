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
import ImageSize from './image-size';

class ImageEdit extends Component {
	constructor() {
		super( ...arguments );
		this.onMediaLibraryPress = this.onMediaLibraryPress.bind( this );
	}

	onUploadPress() {
		// This method should present an image picker from
		// the device.
		//TODO: Implement upload image method.
	}

	onMediaLibraryPress() {
		RNReactNativeGutenbergBridge.onMediaLibraryPress( ( mediaUrl ) => {
			if ( mediaUrl ) {
				this.props.setAttributes( { url: mediaUrl } );
			}
		} );
	}

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
		const { url, caption, height, width } = attributes;

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
					{ this.toolbarEditButton() }
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
									style={ { width: finalWidth, height: finalHeight } }
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
