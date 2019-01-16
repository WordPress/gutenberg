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
				{ __( 'Image' ) }
			</Text>
			<Text style={ styles.emptyStateDescription }>
				{ __( 'Upload a new image or select a file from your library.' ) }
			</Text>
			<View style={ styles.emptyStateButtonsContainer }>
				<Button title={ __( 'Upload' ) } onPress={ props.onUploadMediaPressed } />
				<Button title={ __( 'Media Library' ) } onPress={ props.onMediaLibraryPressed } />
			</View>
		</View>
	);
}

export default MediaPlaceholder;
