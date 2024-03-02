/**
 * External dependencies
 */
import { AccessibilityInfo, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	usePreferredColorSchemeStyle,
	useNetworkConnectivity,
	usePrevious,
} from '@wordpress/compose';
import { Icon } from '@wordpress/components';
import { offline as offlineIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.native.scss';

/**
 * Conditionally announces messages for screen reader users. This Hook provides
 * two benefits over React Native's `accessibilityLiveRegion`:
 *
 * 1. It works on both iOS and Android.
 * 2. It allows announcing a secondary message when the component is inactive.
 *
 * @param {string}  message                   The message to announce.
 * @param {Object}  options                   Options for the Hook.
 * @param {boolean} [options.isActive]        Whether the message should be announced.
 * @param {string}  [options.inactiveMessage] The message to announce when inactive.
 */
function useAccessibilityLiveRegion( message, { isActive, inactiveMessage } ) {
	const { announceForAccessibility } = AccessibilityInfo;
	const prevIsActive = usePrevious( isActive );

	useEffect( () => {
		const unconditionalMessage = typeof isActive === 'undefined';
		const initialRender = typeof prevIsActive === 'undefined';

		if (
			unconditionalMessage ||
			( isActive && ! prevIsActive && ! initialRender )
		) {
			announceForAccessibility( message );
		} else if ( ! isActive && prevIsActive && inactiveMessage ) {
			announceForAccessibility( inactiveMessage );
		}
	}, [
		message,
		isActive,
		prevIsActive,
		inactiveMessage,
		announceForAccessibility,
	] );
}

const OfflineStatus = () => {
	const { isConnected } = useNetworkConnectivity();

	useAccessibilityLiveRegion( __( 'Network connection re-established' ), {
		isActive: isConnected,
		inactiveMessage: __( 'Network connection lost, working offline' ),
	} );

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
		<View
			accessible
			accessibilityRole="alert"
			accessibilityLabel={ __(
				'Network connection lost, working offline'
			) }
			style={ containerStyle }
		>
			<Icon fill={ iconStyle.fill } icon={ offlineIcon } />
			<Text style={ textStyle }>{ __( 'Working Offline' ) } </Text>
		</View>
	) : null;
};

export default OfflineStatus;
