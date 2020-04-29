/**
 * External dependencies
 */
import {
	Animated,
	Easing,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style';

const Tooltip = ( { onTooltipHidden } ) => {
	const [ tooltipPosition, setTooltipPosition ] = useState( null );
	const [ visible, setVisible ] = useState( true );
	const tooltipRef = useRef( null );
	const animationValue = useRef( new Animated.Value( 0 ) ).current;

	useEffect( () => {
		startAnimation();
	}, [ visible ] );

	const onLayout = () => {
		if ( tooltipRef ) {
			tooltipRef.current.measure(
				( _fx, _fy, _width, height, px, py ) => {
					setTooltipPosition( { height, x: px, y: py } );
				}
			);
		}
	};

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
			if ( ! visible && onTooltipHidden ) {
				onTooltipHidden();
			}
		} );
	};

	const stylesOverlay = [
		styles.overlay,
		tooltipPosition && {
			top: -tooltipPosition.y - tooltipPosition.height,
			height: tooltipPosition.y + tooltipPosition.height,
		},
	];

	return (
		<>
			<TouchableWithoutFeedback onPress={ onHide }>
				<View style={ stylesOverlay } />
			</TouchableWithoutFeedback>
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
				<TouchableWithoutFeedback onPress={ onHide }>
					<View
						ref={ tooltipRef }
						onLayout={ onLayout }
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
							{ __( 'Try a starter layout' ) }
						</Text>
						<View style={ styles.arrow } />
					</View>
				</TouchableWithoutFeedback>
			</Animated.View>
		</>
	);
};

export default Tooltip;
