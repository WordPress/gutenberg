/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { Icon } from '@wordpress/components';
import { offline as offlineIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useIsConnected } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './style';

const OfflineStatus = () => {
	const { isConnected } = useIsConnected();

	const containerStyle = usePreferredColorSchemeStyle(
		styles.container,
		styles[ 'container--dark' ]
	);

	const textStyle = usePreferredColorSchemeStyle(
		styles.text,
		styles[ 'text--dark' ]
	);

	const iconStyle = usePreferredColorSchemeStyle(
		styles.icon,
		styles[ 'icon--dark' ]
	);

	return ! isConnected ? (
		<View style={ containerStyle }>
			<Icon fill={ iconStyle.fill } icon={ offlineIcon } />
			<Text style={ textStyle }>{ __( 'Working Offline' ) }</Text>
		</View>
	) : null;
};

export default OfflineStatus;
