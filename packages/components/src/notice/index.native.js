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
	Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const Notice = ( { onNoticeHidden, content, id, status } ) => {
	const [ width, setWidth ] = useState( Dimensions.get( 'window' ).width );
	const [ visible, setVisible ] = useState( true );

	const animationValue = useRef( new Animated.Value( 0 ) ).current;
	const timer = useRef( null );
	const isIOS = Platform.OS === 'ios';

	const onDimensionsChange = () => {
		setWidth( Dimensions.get( 'window' ).width );
	};

	useEffect( () => {
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onDimensionsChange
		);
		return () => {
			dimensionsChangeSubscription.remove();
		};
	}, [] );

	useEffect( () => {
		startAnimation();
		return () => {
			clearTimeout( timer?.current );
		};
	}, [ visible, id ] );

	const onHide = () => {
		setVisible( false );
	};

	const startAnimation = () => {
		Animated.timing( animationValue, {
			toValue: visible ? 1 : 0,
			duration: visible ? 300 : 150,
			useNativeDriver: true,
			easing: Easing.out( Easing.quad ),
		} ).start( () => {
			if ( visible && onNoticeHidden ) {
				timer.current = setTimeout( () => {
					onHide();
				}, 3000 );
			}

			if ( ! visible && onNoticeHidden ) {
				onNoticeHidden( id );
			}
		} );
	};

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

	return (
		<>
			<Animated.View
				style={ [
					styles.notice,
					! isIOS && noticeSolidStyles,
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
				] }
			>
				<TouchableWithoutFeedback onPress={ onHide }>
					<View style={ styles.noticeContent }>
						<Text numberOfLines={ 3 } style={ textStyles }>
							{ content }
						</Text>
					</View>
				</TouchableWithoutFeedback>
				{ isIOS && (
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
