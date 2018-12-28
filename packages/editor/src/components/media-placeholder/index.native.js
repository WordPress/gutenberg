/**
 * External dependencies
 */
import { View, Text, Button } from 'react-native';

import styles from './styles.scss';

import { __ } from '@wordpress/i18n';

function MediaPlaceholder( props ) {
	return (
		<View style={ styles.emptyStateContainer }>
			<Text style={ styles.emptyStateTitle }>
                Image
			</Text>
			<Text style={ styles.emptyStateDescription }>
				Upload a new image or select a file from your library.
			</Text>
			<View style={ styles.emptyStateButtonsContainer }>
				<Button title={ __( 'Upload' ) } onPress={ props.onUploadMediaPress } />
				<Button title={ __( 'Media Library' ) } onPress={ props.onMediaLibraryPress } />
			</View>
		</View>
	);
}

export default MediaPlaceholder;
