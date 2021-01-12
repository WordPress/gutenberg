/**
 * External dependencies
 */
import { Animated, Easing, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default function Tooltip( { visible } ) {
	const animationValue = useRef( new Animated.Value( 1 ) ).current;

	useEffect( () => {
		Animated.timing( animationValue, {
			toValue: visible ? 1 : 0,
			duration: visible ? 300 : 150,
			useNativeDriver: true,
			delay: visible ? 500 : 0,
			easing: Easing.out( Easing.quad ),
		} ).start();
	}, [ visible ] );

	return (
		<Animated.View
			style={ {
				opacity: animationValue,
				transform: [
					{
						translateY: animationValue.interpolate( {
							inputRange: [ 0, 1 ],
							outputRange: [ visible ? 4 : -8, -8 ],
						} ),
					},
				],
			} }
		>
			<View
				style={ [
					styles.tooltip,
					{
						shadowColor: styles.tooltipShadow.color,
						shadowOffset: {
							width: 0,
							height: 2,
						},
						shadowOpacity: 0.25,
						shadowRadius: 2,
						elevation: 2,
					},
				] }
			>
				<Text style={ styles.text }>
					{ __( 'Drag to adjust focal point' ) }
				</Text>
				<View style={ styles.arrow } />
			</View>
		</Animated.View>
	);
}
