/**
 * External dependencies
 */
import {
	Animated,
	Easing,
	Text,
	TouchableWithoutFeedback,
	View,
	Dimensions,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const Notice = ( { onNoticeHidden, content } ) => {
	const [ visible, setVisible ] = useState( true );
	const animationValue = useRef( new Animated.Value( 0 ) ).current;

	useEffect( () => {
		startAnimation();
	}, [ visible ] );

	const onHide = () => {
		setVisible( false );
	};

	const startAnimation = () => {
		Animated.timing( animationValue, {
			toValue: visible ? 1 : 0,
			duration: visible ? 300 : 150,
			useNativeDriver: true,
			delay: visible ? 500 : 0,
			easing: Easing.out( Easing.quad ),
		} ).start( () => {
			if ( ! visible && onNoticeHidden ) {
				onNoticeHidden();
			}
		} );
	};

    console.log(content);

	return (
		<>
			<Animated.View
				style={ {
					opacity: animationValue,
					/*transform: [
						{
							translateY: animationValue.interpolate( {
								inputRange: [ 0, 1 ],
								outputRange: [ visible ? 4 : -8, -8 ],
							} ),
						},
					],*/
				} }
			>
				<TouchableWithoutFeedback onPress={ onHide }>
					<View
						style={ [
                            styles.notice,
                            { width: Dimensions.get( 'window' ).width },
							{
								shadowColor: styles.noticeShadow.color,
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
							{ content }
						</Text>
					</View>
				</TouchableWithoutFeedback>
			</Animated.View>
		</>
    );
};

export default Notice;
