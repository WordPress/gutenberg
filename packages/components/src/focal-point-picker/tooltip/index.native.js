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

function useTooltipContext() {
	const visible = useContext( TooltipContext );

	if ( typeof visible === 'undefined' ) {
		throw new Error(
			'Tooltip compound components cannot be rendered outside of the Tooltip component'
		);
	}

	return visible;
}

function Tooltip( { children, visible } ) {
	return (
		<TooltipContext.Provider value={ visible }>
			{ children }
		</TooltipContext.Provider>
	);
}

function Overlay( { children, onPress, style } ) {
	const visible = useTooltipContext();
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
				if ( onPress ) {
					onPress();
				}
				return false;
			},
		} )
	).current;

	return (
		<View
			{ ...( visible ? panResponder.panHandlers : {} ) }
			style={ style }
		>
			{ children }
		</View>
	);
}

function Label( { align, text, xOffset, yOffset } ) {
	const animationValue = useRef( new Animated.Value( 0 ) ).current;
	const [ dimensions, setDimensions ] = useState( null );
	const visible = useTooltipContext();

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
			{
				translateX:
					( align === 'center' ? -dimensions.width / 2 : 0 ) +
					xOffset,
			},
			{ translateY: -dimensions.height + yOffset },
		];
	}

	const tooltipStyles = [
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
		align === 'left' && styles.tooltipLeftAlign,
	];
	const arrowStyles = [
		styles.arrow,
		align === 'left' && styles.arrowLeftAlign,
	];

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
				style={ tooltipStyles }
			>
				<Text style={ styles.text }>{ text }</Text>
				<View style={ arrowStyles } />
			</View>
		</Animated.View>
	);
}

Label.defaultProps = {
	align: 'center',
	xOffset: 0,
	yOffset: 0,
};

Tooltip.Overlay = Overlay;
Tooltip.Label = Label;

export default Tooltip;
