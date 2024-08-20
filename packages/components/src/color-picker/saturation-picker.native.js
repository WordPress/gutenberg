/**
 * External dependencies
 */
import { View, PanResponder } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import React, { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.native.scss';

export default class SaturationValuePicker extends Component {
	constructor( props ) {
		super( props );

		this.panResponder = PanResponder.create( {
			onStartShouldSetPanResponder: () => true,
			onStartShouldSetPanResponderCapture: () => true,
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: ( evt, gestureState ) => {
				const { onPress } = this.props;
				const { saturation, value } = this.computeSatValPress( evt );
				this.dragStartValue = {
					saturation,
					value,
				};

				if ( onPress ) {
					onPress( {
						...this.computeSatValPress( evt ),
						nativeEvent: evt.nativeEvent,
					} );
				}

				this.fireDragEvent( 'onDragStart', gestureState );
			},
			onPanResponderMove: ( evt, gestureState ) => {
				this.fireDragEvent( 'onDragMove', gestureState );
			},
			onPanResponderTerminationRequest: () => true,
			onPanResponderRelease: ( evt, gestureState ) => {
				this.fireDragEvent( 'onDragEnd', gestureState );
			},
			onPanResponderTerminate: ( evt, gestureState ) => {
				this.fireDragEvent( 'onDragTerminate', gestureState );
			},
			onShouldBlockNativeResponder: () => true,
		} );
	}

	normalizeValue( value ) {
		if ( value < 0 ) {
			return 0;
		}
		if ( value > 1 ) {
			return 1;
		}
		return value;
	}

	computeSatValDrag( gestureState ) {
		const { dx, dy } = gestureState;
		const { size } = this.props;
		const { saturation, value } = this.dragStartValue;
		const diffx = dx / size.width;
		const diffy = dy / size.height;
		return {
			saturation: this.normalizeValue( saturation + diffx ),
			value: this.normalizeValue( value - diffy ),
		};
	}

	computeSatValPress( event ) {
		const { nativeEvent } = event;
		const { locationX, locationY } = nativeEvent;
		const { size } = this.props;
		return {
			saturation: this.normalizeValue( locationX / size.width ),
			value: 1 - this.normalizeValue( locationY / size.height ),
		};
	}

	fireDragEvent( eventName, gestureState ) {
		const { [ eventName ]: event } = this.props;
		if ( event ) {
			event( {
				...this.computeSatValDrag( gestureState ),
				gestureState,
			} );
		}
	}

	render() {
		const {
			size,
			sliderSize = 24,
			hue = 0,
			value = 1,
			saturation = 1,
			containerStyle = {},
			borderRadius = 0,
			currentColor,
		} = this.props;

		return (
			<View
				style={ [
					styles[ 'hsv-container' ],
					containerStyle,
					{
						height: size.height + sliderSize,
						width: size.width + sliderSize,
					},
				] }
				{ ...this.panResponder.panHandlers }
			>
				<LinearGradient
					style={ [
						styles[ 'gradient-container' ],
						{
							borderRadius,
						},
					] }
					colors={ [
						'#fff',
						colord( { h: hue, s: 100, l: 50 } ).toHex(),
					] }
					start={ { x: 0, y: 0.5 } }
					end={ { x: 1, y: 0.5 } }
				>
					<LinearGradient colors={ [ 'rgba(0, 0, 0, 0)', '#000' ] }>
						<View
							style={ {
								height: size.height,
								width: size.width,
							} }
						/>
					</LinearGradient>
				</LinearGradient>
				<View
					pointerEvents="none"
					style={ [
						styles[ 'saturation-slider' ],
						{
							width: sliderSize,
							height: sliderSize,
							borderRadius: sliderSize / 2,
							borderWidth: sliderSize / 10,
							backgroundColor: currentColor,
							transform: [
								{ translateX: size.width * saturation },
								{ translateY: size.height * ( 1 - value ) },
							],
						},
					] }
				/>
			</View>
		);
	}
}
