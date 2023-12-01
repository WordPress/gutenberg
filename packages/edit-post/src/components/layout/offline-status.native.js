/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { offline as offlineIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const OfflineStatus = () => {
	return (
		<View style={ styles.offlineStatusContainer }>
			<Icon icon={ offlineIcon } />
			<Text style={ styles.offlineText }>
				{ __( 'Working Offline' ) }
			</Text>
		</View>
	);
};

export default OfflineStatus;
