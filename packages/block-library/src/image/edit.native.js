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

		return (
			<View style={ { flex: 1 } }>
				<Image
					style={ { width: '100%', height: 200 } }
					resizeMethod="scale"
					source={ { uri: url } }
				/>
			</View>
		);
	}
}

export default ImageEdit;
