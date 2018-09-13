/**
 * External dependencies
 */
import { View, Text } from 'react-native';

export default function ImageEdit( { attributes } ) {
	const { url } = attributes;

	const noImage = (
		<View style={ { padding: 12, backgroundColor: '#f2f2f2' } }>
			<Text style={ { textAlign: 'center' } }>No image selected </Text>
		</View>
	);

	const image = (
		<View style={ { padding: 12, backgroundColor: '#f2f2f2' } }>
			<Text style={ { textAlign: 'center' } }>{ url }</Text>
		</View> );

	return ! url ? noImage : image;
}
