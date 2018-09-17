/**
 * External dependencies
 */
import { View, Image, Text, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { MediaPlaceholder } from '@wordpress/editor';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ImageSize from './image-size';

class ImageEdit extends Component {
	constructor() {
		super( ...arguments );
		this.updateWidth = this.updateWidth.bind( this );
		this.updateHeight = this.updateHeight.bind( this );
	}

	onUploadPress() {
		// This method should present an image picker from
		// the device.
		//TODO: Implement upload image method.
	}

	onMediaLibraryPress() {
		// This method should present an image picker from
		// the WordPress media library.
		//TODO: Implement media library method.
	}

	updateWidth( width ) {
		this.props.setAttributes( { width: this.intOrUndefined( width ) } );
	}

	updateHeight( height ) {
		this.props.setAttributes( { height: this.intOrUndefined( height ) } );
	}

	intOrUndefined( value ) {
		return parseInt( value, 10 ) || undefined;
	}

	// Theses "Size Controls" are for tests pruposes only.
	getSizeControls( imageHeight, imageWidth ) {
		const { width, height } = this.props.attributes;

		return (
			<View style={ { flexDirection: 'row', justifyContent: 'center', flex: 1 } }>
				<View style={ { padding: 5, flexDirection: 'row', flex: 1 } }>
					<Text>Width: </Text>
					<TextInput
						value={ width !== undefined ? width.toString() : '' }
						placeholder={ imageWidth.toString() }
						onChangeText={ this.updateWidth }
					/>
				</View>
				<View style={ { padding: 5, flexDirection: 'row', flex: 1 } }>
					<Text>Height: </Text>
					<TextInput
						value={ height !== undefined ? height.toString() : '' }
						placeholder={ imageHeight.toString() }
						onChangeText={ this.updateHeight }
					/>
				</View>
			</View>
		);
	}

	render() {
		const { attributes, isSelected } = this.props;
		const { url, width, height } = attributes;

		if ( ! url ) {
			return (
				<MediaPlaceholder
					onUploadPress={ this.onUploadPress }
					onMediaLibraryPress={ this.onMediaLibraryPress }
				/>
			);
		}

		return (
			<ImageSize src={ url }>
				{ ( sizes ) => {
					const {
						imageWidthWithinContainer,
						imageHeightWithinContainer,
						imageWidth,
						imageHeight,
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
						<View>
							{ isSelected ? this.getSizeControls( imageHeight, imageWidth ) : null }
							<View style={ { flex: 1 } } >
								<Image
									style={ { height: finalHeight, width: finalWidth } }
									resizeMethod="scale"
									source={ { uri: url } }
								/>
							</View>
						</View>
					);
				} }
			</ImageSize>
		);
	}
}

export default ImageEdit;
