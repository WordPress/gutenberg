/**
 * External dependencies
 */
import { View } from 'react-native';

// import React, { useRef } from 'react';
// import { View, PanResponder, StyleSheet } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import tinycolor from 'tinycolor2';

// const SaturationValuePicker = ( props ) => {
// 	const {
// 		size,
// 		sliderSize = 24,
// 		hue = 0,
// 		value = 1,
// 		saturation = 1,
// 		onPress,
// 		onDragStart,
// 		onDragMove,
// 		onDragEnd,
// 		onDragTerminate,
// 		containerStyle = {},
// 		borderRadius = 0,
// 	} = props;

// 	const normalizeValue = ( value ) => {
// 		if ( value < 0 ) return 0;
// 		if ( value > 1 ) return 1;
// 		return value;
// 	};

// 	const panResponder = useRef(
// 		PanResponder.create( {
// 			onStartShouldSetPanResponder: () => true,
// 			onStartShouldSetPanResponderCapture: () => true,
// 			onMoveShouldSetPanResponder: () => true,
// 			onMoveShouldSetPanResponderCapture: () => true,
// 			onPanResponderGrant: ( evt, gestureState ) => {
// 				const { saturation: s, value: v } = computeSatValPress( evt );
// 				dragStartValue.current = { saturation: s, value: v };

// 				if ( onPress ) {
// 					onPress( {
// 						...computeSatValPress( evt ),
// 						nativeEvent: evt.nativeEvent,
// 					} );
// 				}

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

// 	const dragStartValue = useRef( { saturation, value } );

// 	const getCurrentColor = () => {
// 		return tinycolor(
// 			`hsv ${ hue } ${ saturation } ${ value }`
// 		).toHexString();
// 	};

// 	const computeSatValDrag = ( gestureState ) => {
// 		const { dx, dy } = gestureState;
// 		const diffx = dx / size.width;
// 		const diffy = dy / size.height;
// 		return {
// 			saturation: normalizeValue(
// 				dragStartValue.current.saturation + diffx
// 			),
// 			value: normalizeValue( dragStartValue.current.value - diffy ),
// 		};
// 	};

// 	const computeSatValPress = ( event ) => {
// 		const { nativeEvent } = event;
// 		const { locationX, locationY } = nativeEvent;
// 		return {
// 			saturation: normalizeValue( locationX / size.width ),
// 			value: 1 - normalizeValue( locationY / size.height ),
// 		};
// 	};

// 	const fireDragEvent = ( eventName, gestureState ) => {
// 		const event = props[ eventName ];
// 		if ( event ) {
// 			event( {
// 				...computeSatValDrag( gestureState ),
// 				gestureState,
// 			} );
// 		}
// 	};

// 	return (
// 		<View
// 			style={ [
// 				styles.container,
// 				containerStyle,
// 				{
// 					height: size.height + sliderSize,
// 					width: size.width + sliderSize,
// 				},
// 			] }
// 			{ ...panResponder.panHandlers }
// 		>
// 			<LinearGradient
// 				style={ [
// 					styles.gradientContainer,
// 					{
// 						borderRadius,
// 					},
// 				] }
// 				colors={ [
// 					'#fff',
// 					tinycolor( `hsl ${ hue } 1 0.5` ).toHexString(),
// 				] }
// 				start={ { x: 0, y: 0.5 } }
// 				end={ { x: 1, y: 0.5 } }
// 			>
// 				<LinearGradient colors={ [ 'rgba(0, 0, 0, 0)', '#000' ] }>
// 					<View
// 						style={ {
// 							height: size.height,
// 							width: size.width,
// 						} }
// 					/>
// 				</LinearGradient>
// 			</LinearGradient>
// 			<View
// 				pointerEvents="none"
// 				style={ [
// 					styles.slider,
// 					{
// 						width: sliderSize,
// 						height: sliderSize,
// 						borderRadius: sliderSize / 2,
// 						borderWidth: sliderSize / 10,
// 						backgroundColor: getCurrentColor(),
// 						transform: [
// 							{ translateX: size.width * saturation },
// 							{ translateY: size.height * ( 1 - value ) },
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
// 	gradientContainer: {
// 		overflow: 'hidden',
// 	},
// 	slider: {
// 		top: 0,
// 		left: 0,
// 		position: 'absolute',
// 		borderColor: '#fff',
// 	},
// } );

// export default SaturationValuePicker;

const SaturationPicker = () => {
	return <View />;
};

export default SaturationPicker;
