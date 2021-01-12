/**
 * External dependencies
 */
import React from 'react';
import { Animated, Easing, PanResponder, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const TooltipContext = React.createContext();

function Tooltip( { children, onPress, style, visible } ) {
	const panResponder = useRef(
		PanResponder.create( {
			/**
			 * To allow dimissing the tooltip on press while also avoiding blocking
			 * interactivity within the child context, we place this `onPress` side
			 * effect within the `onStartShouldSetPanResponderCapture` callback.
			 *
			 * This is a bit unorthodox, but may be the simplest approach to achieving
			 * this outcome. This is effectively a gesture responder that never
			 * becomes the controlling responder. https://bit.ly/2J3ugKF
			 */
			onStartShouldSetPanResponderCapture: () => {
				onPress();
				return false;
			},
		} )
	).current;

	return (
		<TooltipContext.Provider value={ visible }>
			<View
				{ ...( visible ? panResponder.panHandlers : {} ) }
				style={ style }
			>
				{ children }
			</View>
		</TooltipContext.Provider>
	);
}

function Label( { text, xOffset, yOffset } ) {
	const animationValue = useRef( new Animated.Value( 0 ) ).current;
	const [ dimensions, setDimensions ] = useState( null );
	const visible = useContext( TooltipContext );

	if ( typeof visible === 'undefined' ) {
		throw new Error(
			'Tooltip.Label cannot be rendered outside of the Tooltip component'
		);
	}

	useEffect( () => {
		startAnimation();
	}, [ visible ] );

	const startAnimation = () => {
		Animated.timing( animationValue, {
			toValue: visible ? 1 : 0,
			duration: visible ? 300 : 150,
			useNativeDriver: true,
			delay: visible ? 500 : 0,
			easing: Easing.out( Easing.quad ),
		} ).start();
	};

	// Transforms rely upon onLayout to enable custom offsets additions
	let tooltipTransforms;
	if ( dimensions ) {
		tooltipTransforms = [
			{ translateX: -dimensions.width / 2 + xOffset },
			{ translateY: -dimensions.height + yOffset },
		];
	}

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
				onLayout={ ( { nativeEvent } ) => {
					const { height, width } = nativeEvent.layout;
					setDimensions( { height, width } );
				} }
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
						transform: tooltipTransforms,
					},
				] }
			>
				<Text style={ styles.text }>{ text }</Text>
				<View style={ styles.arrow } />
			</View>
		</Animated.View>
	);
}

Label.defaultProps = {
	xOffset: 0,
	yOffset: 0,
};

Tooltip.Label = Label;

export default Tooltip;
