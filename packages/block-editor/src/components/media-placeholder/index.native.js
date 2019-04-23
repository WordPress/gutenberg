/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function MediaPlaceholder( props ) {
	return (
		<TouchableWithoutFeedback
			accessibilityLabel={ sprintf( '%s%s %s', __( 'Image block' ), __( '.' ), __( 'Empty' ) ) }
			accessibilityRole={ 'button' }
			accessibilityHint={ __( 'Double tap to select an image' ) }
			onPress={ props.onMediaOptionsPressed }
		>
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
