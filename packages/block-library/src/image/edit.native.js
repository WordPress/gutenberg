/**
 * External dependencies
 */
import { View, Image, TextInput } from 'react-native';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from '@wordpress/editor';
import { render } from '@wordpress/element/src';
import { Component } from '@wordpress/element';

class ImageEdit extends Component {

	constructor() {
		super( ...arguments );
		this.updateWidth = this.updateWidth.bind( this );
		this.updateHeight = this.updateHeight.bind( this );

		this.state = {
			height: 0,
			width: 0,
		};
	}

	componentDidMount = () => {
		const { url } = this.props.attributes;

		Image.getSize(url, (imageRealWidth, imageRealHeight) => {
			this.image = {}
			this.image.width = imageRealWidth
			this.image.height = imageRealHeight
			this.setState({ imageRealWidth, imageRealHeight}, this.calculateImageDimentions)
		});
	}

	calculateImageDimentions = () => {
		if (this.image === undefined || this.clientWidth === undefined) {
			return;
		}

		const maxWidth = this.clientWidth;
		const exceedMaxWidth = this.image.width > maxWidth;
		const ratio = this.image.height / this.image.width;
		const width = exceedMaxWidth ? maxWidth : this.image.width;
		const height = exceedMaxWidth ? maxWidth * ratio : this.image.height;
		this.setState( { width, height } );
	}

	onLayout = (event) => {
		let {width, height} = event.nativeEvent.layout;
		this.clientWidth = width;
		this.calculateImageDimentions();
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
		console.log(width);
		this.props.setAttributes( { width: parseInt( width, 10 ) } );
	}

	updateHeight( height ) {
		this.props.setAttributes( { height: parseInt( height, 10 ) } );
	}

	render() {
		const { url, width, height } = this.props.attributes;

		if ( ! url ) {
			return (
				<MediaPlaceholder
					onUploadPress={ onUploadPress }
					onMediaLibraryPress={ onMediaLibraryPress }
				/>
			);
		}

		const sizeControlls = (
			<View style={{flexDirection: 'row', flexDirection: 'row'}}>
				<TextInput 
					placeholder='Width'
					onChangeText = { this.updateWidth }
				/>
				<TextInput 
					placeholder='Height'
					onChangeText = { this.updateHeight }
				/>
			</View>
		)

		let imageHeight = this.state.height;
		if (height > 0 && height < imageHeight) {
			imageHeight = height;
		}

		let imageWidth = this.state.width;
		if (width > 0 && width < imageWidth) {
			imageWidth = width;
		}

		return (
			<View>
			{ sizeControlls }
			<View style={ { flex: 1 } } onLayout={this.onLayout}>
				<Image
					style={ { height: imageHeight, width: imageWidth } }
					resizeMethod="scale"
					source={ { uri: url } }
				/>
			</View>
			</View>
		);
	}
}

export default ImageEdit;
