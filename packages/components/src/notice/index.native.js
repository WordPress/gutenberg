/**
 * External dependencies
 */
import {
	Animated,
	Easing,
	Text,
	TouchableWithoutFeedback,
	View,
	useWindowDimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useCallback, Platform } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HIDE_TIMER = 3000;

const Notice = ( { onNoticeHidden, content, id, status } ) => {
	const { width } = useWindowDimensions();
	const animationValue = useRef( new Animated.Value( 0 ) ).current;
	const timer = useRef( null );

	useEffect( () => {
		// start animation
		Animated.timing( animationValue, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
			easing: Easing.out( Easing.quad ),
		} ).start( ( { finished } ) => {
			if ( finished && onNoticeHidden ) {
				timer.current = setTimeout( () => {
					onHide();
				}, HIDE_TIMER );
			}
		} );

		return () => {
			clearTimeout( timer?.current );
		};
	}, [ animationValue, onHide, onNoticeHidden ] );

	const onHide = useCallback( () => {
		Animated.timing( animationValue, {
			toValue: 0,
			duration: 150,
			useNativeDriver: true,
			easing: Easing.out( Easing.quad ),
		} ).start( ( { finished } ) => {
			if ( finished && onNoticeHidden ) {
				onNoticeHidden( id );
			}
		} );
	}, [ animationValue, onNoticeHidden, id ] );

	const noticeSolidStyles = usePreferredColorSchemeStyle(
		styles.noticeSolid,
		styles.noticeSolidDark
	);

	const successTextStyles = usePreferredColorSchemeStyle(
		styles.successText,
		styles.successTextDark
	);

	const errorTextStyles = usePreferredColorSchemeStyle(
		styles.errorText,
		styles.errorTextDark
	);

	const textStyles = [
		status === 'success' && successTextStyles,
		status === 'error' && errorTextStyles,
	];

	const containerStyles = [
		styles.notice,
		! Platform.isIOS && noticeSolidStyles,
		{
			width,
			transform: [
				{
					translateY: animationValue.interpolate( {
						inputRange: [ 0, 1 ],
						outputRange: [ -24, 0 ],
					} ),
				},
			],
		},
	];

	return (
		<>
			<Animated.View style={ containerStyles }>
				<TouchableWithoutFeedback onPress={ onHide }>
					<View style={ styles.noticeContent }>
						<Text numberOfLines={ 3 } style={ textStyles }>
							{ content }
						</Text>
					</View>
				</TouchableWithoutFeedback>
				{ Platform.isIOS && (
					<BlurView
						style={ styles.blurBackground }
						blurType="prominent"
						blurAmount={ 10 }
					/>
				) }
			</Animated.View>
		</>
	);
};

export default Notice;
