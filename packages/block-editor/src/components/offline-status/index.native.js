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

/**
 * Internal dependencies
 */
import styles from './style';

const OfflineStatus = () => {
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

	return (
		<View style={ containerStyle }>
			<Icon fill={ iconStyle.fill } icon={ offlineIcon } />
			<Text style={ textStyle }>{ __( 'Working Offline' ) }</Text>
		</View>
	);
};

export default OfflineStatus;
