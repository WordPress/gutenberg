/**
 * External dependencies
 */
import { View, Text, Image, Button } from 'react-native';

/**
 * Internal dependencies
 */
import {
	MediaPlaceholder
} from '@wordpress/editor';

export default function ImageEdit( { attributes } ) {
	const { url, width, height } = attributes;

	const onUploadPress = ()=> {
	}

	const onMediaLibraryPress = ()=> {
	}

	if (! url) {
		return (
			<MediaPlaceholder
				onUploadPress = {onUploadPress}
				onMediaLibraryPress = {onMediaLibraryPress}
			/>
		);
	}

	return (
		<View style={ { flex: 1 } }>
			<Image
				style={{width:'100%', height:200}}
				resizeMethod = 'scale'
				source={{uri: url}}
			/>
		</View> 
	);
}
