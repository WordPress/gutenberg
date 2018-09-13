/**
 * External dependencies
 */
import { View, Text, Image, Button } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export default function ImageEdit( { attributes } ) {
	const { url, width, height } = attributes;

	const onUploadPress = ()=> {

	}

	const onMediaLibraryPress = ()=> {
		
	}

	if (! url) {
		return (
			<View style={ styles.emptyStateContainer }>
				<Text style={ styles.emptyStateTitle }>
					Image
				</Text>
				<Text style={ styles.emptyStateDescription }>
					Upload a new image or select a file from your library.
				</Text>
				<View style={ styles.emptyStateButtonsContainer }>
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
