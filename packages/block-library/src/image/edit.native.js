/**
 * External dependencies
 */
import { View, Image } from 'react-native';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from '@wordpress/editor';

export default function ImageEdit( { attributes } ) {
	const { url } = attributes;

	const onUploadPress = () => {
		// This method should present an image picker from
		// the device.
		//TODO: Implement upload image method.
	};

	const onMediaLibraryPress = () => {
		// This method should present an image picker from
		// the WordPress media library.
		//TODO: Implement media library method.
	};

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
