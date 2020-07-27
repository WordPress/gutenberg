/**
 * External dependencies
 */
import { Animated, Easing, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { refresh } from '../gridicons';

export default function LoadingSpinner() {
	const [ rotation ] = useState( new Animated.Value( 0 ) );
	useEffect( () => {
		Animated.loop(
			Animated.timing( rotation, {
				useNativeDriver: true,
				toValue: 1,
				duration: 1000,
				easing: Easing.linear,
			} )
		).start();
	}, [] );

	return (
		<View style={ { alignItems: 'center' } }>
			<Animated.View
				style={ {
					width: 24,
					height: 24,
					transform: [
						{
							rotate: rotation.interpolate( {
								inputRange: [ 0, 1 ],
								outputRange: [ '0deg', '360deg' ],
							} ),
						},
					],
				} }
			>
				{ refresh }
			</Animated.View>
		</View>
	);
};
