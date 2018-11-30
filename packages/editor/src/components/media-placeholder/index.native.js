/**
 * External dependencies
 */
import { View, Text, Button } from 'react-native';

import styles from './styles.scss';

function MediaPlaceholder( props ) {
	return (
		<View style={ styles.emptyStateContainer }>
			<Text style={ styles.emptyStateTitle }>
                Image
			</Text>
			<Text style={ styles.emptyStateDescription }>
                Select an image from your library.
			</Text>
			<View style={ styles.emptyStateButtonsContainer }>
				<Button title="Media Library" onPress={ props.onMediaLibraryPress } />
			</View>
		</View>
	);
}

export default MediaPlaceholder;
