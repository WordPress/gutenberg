/**
 * External dependencies
 */
import { View } from 'react-native';

// import React, { useRef, useEffect } from 'react';
// import { Animated, View, StyleSheet, PanResponder } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import tinycolor from 'tinycolor2';
// import normalizeValue from './utils';

// const HuePicker = ( props ) => {
// 	const {
// 		sliderSize = 24,
// 		barWidth = 200,
// 		barHeight = 12,
// 		borderRadius = 0,
// 		hue = 0,
// 		onPress,
// 		onDragStart,
// 		onDragMove,
// 		onDragEnd,
// 		onDragTerminate,
// 	} = props;

// 	const hueColors = [
// 		'#ff0000',
// 		'#ffff00',
// 		'#00ff00',
// 		'#00ffff',
// 		'#0000ff',
// 		'#ff00ff',
// 		'#ff0000',
// 	];

//     const normalizeValue = ( value ) => {
// 		if ( value < 0 ) return 0;
// 		if ( value > 1 ) return 1;
// 		return value;
// 	};

// 	const borderWidth = sliderSize / 10;
// 	const sliderX = useRef(
// 		new Animated.Value( ( barHeight * hue ) / 360 )
// 	).current;
// 	const dragStartValue = useRef( 0 );

// 	const panResponder = useRef(
// 		PanResponder.create( {
// 			onStartShouldSetPanResponder: () => true,
// 			onStartShouldSetPanResponderCapture: () => true,
// 			onMoveShouldSetPanResponder: () => true,
// 			onMoveShouldSetPanResponderCapture: () => true,
// 			onPanResponderGrant: ( evt, gestureState ) => {
// 				const updatedHue = computeHueValuePress( evt );

// 				if ( onPress ) {
// 					onPress( {
// 						hue: updatedHue,
// 						nativeEvent: evt.nativeEvent,
// 					} );
// 				}

// 				dragStartValue.current = updatedHue;
// 				fireDragEvent( 'onDragStart', gestureState );
// 			},
// 			onPanResponderMove: ( evt, gestureState ) => {
// 				fireDragEvent( 'onDragMove', gestureState );
// 			},
// 			onPanResponderTerminationRequest: () => true,
// 			onPanResponderRelease: ( evt, gestureState ) => {
// 				fireDragEvent( 'onDragEnd', gestureState );
// 			},
// 			onPanResponderTerminate: ( evt, gestureState ) => {
// 				fireDragEvent( 'onDragTerminate', gestureState );
// 			},
// 			onShouldBlockNativeResponder: () => true,
// 		} )
// 	).current;

// 	useEffect( () => {
// 		const updatedSliderX =
// 			( ( barWidth - sliderSize + borderWidth ) * hue ) / 360;
// 		sliderX.setValue( updatedSliderX );
// 	}, [ hue, barWidth, sliderSize, borderWidth, sliderX ] );

// 	const getContainerStyle = () => {
// 		const paddingLeft = sliderSize / 2;
// 		const paddingTop =
// 			sliderSize - barHeight > 0 ? ( sliderSize - barHeight ) / 2 : 0;
// 		return [
// 			styles.container,
// 			{
// 				paddingTop,
// 				paddingBottom: paddingTop,
// 				paddingLeft,
// 				paddingRight: paddingLeft,
// 			},
// 		];
// 	};

// 	const getCurrentColor = () => {
// 		return tinycolor( `hue ${ hue } 1.0 0.5` ).toHexString();
// 	};

// 	const computeHueValueDrag = ( gestureState ) => {
// 		const { dx } = gestureState;
// 		const diff = dx / barWidth;
// 		const updatedHue =
// 			normalizeValue( dragStartValue.current / 360 + diff ) * 360;
// 		return updatedHue;
// 	};

// 	const computeHueValuePress = ( event ) => {
// 		const { nativeEvent } = event;
// 		const { locationX } = nativeEvent;
// 		const updatedHue = normalizeValue( locationX / barWidth ) * 360;
// 		return updatedHue;
// 	};

// 	const fireDragEvent = ( eventName, gestureState ) => {
// 		const event = props[ eventName ];
// 		if ( event ) {
// 			event( {
// 				hue: computeHueValueDrag( gestureState ),
// 				gestureState,
// 			} );
// 		}
// 	};

// 	return (
// 		<View
// 			style={ getContainerStyle() }
// 			{ ...panResponder.panHandlers }
// 			hitSlop={ {
// 				top: 10,
// 				bottom: 10,
// 				left: 0,
// 				right: 0,
// 			} }
// 		>
// 			<LinearGradient
// 				colors={ hueColors }
// 				style={ {
// 					borderRadius,
// 				} }
// 				start={ { x: 0, y: 0 } }
// 				end={ { x: 1, y: 0 } }
// 			>
// 				<View
// 					style={ {
// 						width: barWidth,
// 						height: barHeight,
// 					} }
// 				/>
// 			</LinearGradient>
// 			<Animated.View
// 				pointerEvents="none"
// 				style={ [
// 					styles.slider,
// 					{
// 						width: sliderSize,
// 						height: sliderSize,
// 						left: ( sliderSize - borderWidth ) / 2,
// 						borderRadius: sliderSize / 2,
// 						transform: [
// 							{
// 								translateX: sliderX,
// 							},
// 						],
// 					},
// 				] }
// 			/>
// 		</View>
// 	);
// };

// const styles = StyleSheet.create( {
// 	container: {
// 		justifyContent: 'center',
// 		alignItems: 'center',
// 	},
// 	slider: {
// 		position: 'absolute',
// 		backgroundColor: '#fff',
// 		shadowColor: '#000',
// 		shadowOffset: {
// 			width: 0,
// 			height: 7,
// 		},
// 		shadowOpacity: 0.43,
// 		shadowRadius: 10,
// 		elevation: 5,
// 	},
// } );

// export default HuePicker;

const HuePicker = () => {
	return <View />;
};

export default HuePicker;
