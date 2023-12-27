/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	usePreferredColorSchemeStyle,
	useNetworkConnectivity,
} from '@wordpress/compose';
import { Icon } from '@wordpress/components';
import { offline as offlineIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.native.scss';

const OfflineStatus = () => {
	const { isConnected } = useNetworkConnectivity();

	const containerStyle = usePreferredColorSchemeStyle(
		styles.offline,
		styles.offline__dark
	);

	const textStyle = usePreferredColorSchemeStyle(
		styles[ 'offline--text' ],
		styles[ 'offline--text__dark' ]
	);

	const iconStyle = usePreferredColorSchemeStyle(
		styles[ 'offline--icon' ],
		styles[ 'offline--icon__dark' ]
	);

	return ! isConnected ? (
		<View style={ containerStyle }>
			<Icon fill={ iconStyle.fill } icon={ offlineIcon } />
			<Text style={ textStyle }>{ __( 'Working Offline' ) }</Text>
		</View>
	) : null;
};

export default OfflineStatus;
