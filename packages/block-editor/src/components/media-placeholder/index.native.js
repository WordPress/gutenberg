/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function MediaPlaceholder( props ) {
	return (
		<TouchableWithoutFeedback onPress={ props.onMediaOptionsPressed }>
			<View style={ styles.emptyStateContainer }>
				<Dashicon icon={ 'format-image' } />
				<Text style={ styles.emptyStateTitle }>
					{ __( 'Image' ) }
				</Text>
				<Text style={ styles.emptyStateDescription }>
					{ __( 'CHOOSE IMAGE' ) }
				</Text>
			</View>
		</TouchableWithoutFeedback>
	);
}

export default MediaPlaceholder;
