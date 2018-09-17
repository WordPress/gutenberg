/**
 * External dependencies
 */
import { View, Image, Text, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { MediaPlaceholder } from '@wordpress/editor';
import { render } from '@wordpress/element/src';
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

	onUploadPress = () => {
		// This method should present an image picker from
		// the device.
		//TODO: Implement upload image method.
	};

	onMediaLibraryPress = () => {
		// This method should present an image picker from
		// the WordPress media library.
		//TODO: Implement media library method.
	};

	updateWidth( width ) {
		this.props.setAttributes( { width: parseInt( width, 10 ) } );
	}

	updateHeight( height ) {
		this.props.setAttributes( { height: parseInt( height, 10 ) } );
	}

	getSizeControls() {
		const { width, height } = this.props.attributes;

		return (
			<View style={{flexDirection: 'row', justifyContent: "center", flex: 1}}>
				<View style={{padding: 5, flexDirection: 'row', flex: 1}}>
					<Text>Width: </Text>
					<TextInput
						value={ width !== undefined ? width.toString() : '' }
						placeholder={ this.image !== undefined ? this.image.width.toString() : '0' }
						onChangeText = { this.updateWidth }
					/>
				</View>
				<View style={{padding: 5, flexDirection: 'row', flex: 1}}>
					<Text>Height: </Text>
					<TextInput 
						value={ height !== undefined ? height.toString() : '' }
						placeholder={ this.image !== undefined ? this.image.height.toString() : '0' }
						onChangeText = { this.updateHeight }
					/>
				</View>
			</View>
		)
	}

	render() {
		const { attributes, isSelected } = this.props;
		const { url, width, height } = attributes;

		if ( ! url ) {
			return (
				<MediaPlaceholder
					onUploadPress={ onUploadPress }
					onMediaLibraryPress={ onMediaLibraryPress }
				/>
			);
		}

		return (
			<ImageSize src={url}>
			{ (sizes) => {
				
				const {
					imageWidthWithinContainer,
					imageHeightWithinContainer,
					imageWidth,
					imageHeight,
				} = sizes;

				// sizeControls is for tests pruposes only. It will be replaced when the 

				let finalHeight = imageHeightWithinContainer;
				if (height > 0 && height < imageHeightWithinContainer) {
					finalHeight = height;
				}
		
				let finalWidth = imageWidthWithinContainer;
				if (width > 0 && width < imageWidthWithinContainer) {
					finalWidth = width;
				}
				
				return (
					<View>
						{ isSelected ? this.getSizeControls() : null }
						<View style={ { flex: 1 } } >
							<Image
								style={ { height: finalHeight, width: finalWidth } }
								resizeMethod="scale"
								source={ { uri: url } }
							/>
						</View>
					</View>
				)
			}}

			</ImageSize>
		);
	}
}

export default ImageEdit;
