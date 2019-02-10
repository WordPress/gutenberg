/**
 * External dependencies
 */
import { View, Text, Button } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

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
				<Button title={ __( 'Device Library' ) } onPress={ props.onUploadMediaPressed } />
				<Button title={ __( 'Take photo' ) } onPress={ props.onCapturePhotoPressed } />
			</View>
			<Button title={ __( 'Media Library' ) } onPress={ props.onMediaLibraryPressed } />
		</View>
	);
}

export default MediaPlaceholder;
