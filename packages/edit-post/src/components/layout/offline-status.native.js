/**
 * External dependencies
 */
import { Text } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import offlineIcon from './offline-icon';

const OfflineStatus = () => {
	const translateY = useSharedValue( -10 );
	const slideIn = () => {
		translateY.value = withTiming( 0, { duration: 100 } );
	};

	useEffect( () => {
		slideIn();
	}, [] );

	const animatedStyle = useAnimatedStyle( () => {
		return {
			transform: [ { translateY: translateY.value } ],
		};
	} );

	return (
		<Animated.View
			style={ [ styles.offlineStatusContainer, animatedStyle ] }
		>
			<Icon icon={ offlineIcon } />
			<Text style={ styles.offlineText }>
				{ ' ' }
				{ __( 'Working Offline' ) }
			</Text>
		</Animated.View>
	);
};

export default OfflineStatus;
