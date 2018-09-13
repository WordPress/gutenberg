/**
 * External dependencies
 */
import { View, Text, Image, Button } from 'react-native';

export default function ImageEdit( { attributes } ) {
	const { url, width, height } = attributes;

	const onUploadPress = ()=> {

	}

	const onMediaLibraryPress = ()=> {
		
	}

	if (! url) {
		return (
			<View style={ { alignItems: 'center', padding: 12, backgroundColor: '#f2f2f2' } }>
				<Text style={ { textAlign: 'center', fontWeight: "bold", paddingBottom: 10} }>Image</Text>
				<Text style={ { textAlign: 'center' } }>Upload a new image or select a file from your library.</Text>
				<View style={{flexDirection: 'row', alignItems: 'center'}}>
					<Button title="Upload" onPress={onUploadPress}/>
					<Button title="Media Library" onPress={onMediaLibraryPress}/>
				</View>
			</View>
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
