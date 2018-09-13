/**
 * External dependencies
 */
import { View, Text, Image } from 'react-native';

export default function ImageEdit( { attributes } ) {
	const { url, width, height } = attributes;

	const noImage = (
		<View style={ { padding: 12, backgroundColor: '#f2f2f2' } }>
			<Text style={ { textAlign: 'center' ,fontWeight: "bold"} }>🖼 Image</Text>
			<Text style={ { textAlign: 'center' } }>Upload a new image or select a file from your library.</Text>
		</View>
	);

	const image = (
		<View style={ { flex: 1 } }>
		<Image
			style={{width:'100%', height:200}}
			resizeMethod = 'scale'
          source={{uri: url}}
        />
		</View> );

	return ! url ? noImage : image;
}
