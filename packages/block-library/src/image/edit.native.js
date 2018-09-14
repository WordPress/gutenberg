/**
 * External dependencies
 */
import { View, Image } from 'react-native';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from '@wordpress/editor';
import { render } from '@wordpress/element/src';
import { Component } from '@wordpress/element';

class ImageEdit extends Component {

	constructor() {
		super( ...arguments );
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
		console.log('calculateImageDimentions')

		if (this.image === undefined || this.clientWidth === undefined) {
			console.log('false')
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

		console.log('Rendering');
		return (
			<View style={ { flex: 1 } } onLayout={this.onLayout}>
				<Image
					style={ { width: this.state.width, height: this.state.height } }
					resizeMethod="scale"
					source={ { uri: url } }
				/>
			</View>
		);
	}
}

export default ImageEdit;
