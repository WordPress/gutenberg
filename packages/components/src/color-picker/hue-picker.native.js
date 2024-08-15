/**
 * External dependencies
 */
import { Animated, View, PanResponder } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * WordPress dependencies
 */
import React, { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default class HuePicker extends Component {
	constructor( props ) {
		super( props );
		this.hueColors = [
			'#ff0000',
			'#ffff00',
			'#00ff00',
			'#00ffff',
			'#0000ff',
			'#ff00ff',
			'#ff0000',
		];
		this.sliderX = new Animated.Value(
			( props.barHeight * props.hue ) / 360
		);
		this.panResponder = PanResponder.create( {
			onStartShouldSetPanResponder: () => true,
			onStartShouldSetPanResponderCapture: () => true,
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: ( evt, gestureState ) => {
				const { onPress } = this.props;
				this.dragStartValue = this.computeHueValuePress( evt );

				if ( onPress ) {
					onPress( {
						hue: this.computeHueValuePress( evt ),
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

	componentDidUpdate( prevProps ) {
		const { hue = 0, barWidth = 200, sliderSize = 24 } = this.props;
		const borderWidth = sliderSize / 10;
		if ( prevProps.hue !== hue || prevProps.barWidth !== barWidth ) {
			this.sliderX.setValue(
				( ( barWidth - sliderSize + borderWidth ) * hue ) / 360
			);
		}
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

	getContainerStyle() {
		const {
			sliderSize = 24,
			barHeight = 12,
			containerStyle = {},
		} = this.props;
		const paddingLeft = sliderSize / 2;
		const paddingTop =
			sliderSize - barHeight > 0 ? ( sliderSize - barHeight ) / 2 : 0;
		return [
			styles[ 'hsv-container' ],
			containerStyle,
			{
				paddingTop,
				paddingBottom: paddingTop,
				paddingLeft,
				paddingRight: paddingLeft,
			},
		];
	}

	computeHueValueDrag( gestureState ) {
		const { dx } = gestureState;
		const { barWidth = 200 } = this.props;
		const { dragStartValue } = this;
		const diff = dx / barWidth;
		const updatedHue =
			this.normalizeValue( dragStartValue / 360 + diff ) * 360;
		return updatedHue;
	}

	computeHueValuePress( event ) {
		const { nativeEvent } = event;
		const { locationX } = nativeEvent;
		const { barWidth = 200 } = this.props;
		const updatedHue = this.normalizeValue( locationX / barWidth ) * 360;
		return updatedHue;
	}

	fireDragEvent( eventName, gestureState ) {
		const { [ eventName ]: event } = this.props;
		if ( event ) {
			event( {
				hue: this.computeHueValueDrag( gestureState ),
				gestureState,
			} );
		}
	}

	firePressEvent( event ) {
		const { onPress } = this.props;
		if ( onPress ) {
			onPress( {
				hue: this.computeHueValuePress( event ),
				nativeEvent: event.nativeEvent,
			} );
		}
	}

	render() {
		const { hueColors } = this;
		const {
			sliderSize = 24,
			barWidth = 200,
			barHeight = 12,
			borderRadius = 0,
		} = this.props;
		const borderWidth = sliderSize / 10;
		return (
			<View
				style={ this.getContainerStyle() }
				{ ...this.panResponder.panHandlers }
				hitSlop={ {
					top: 10,
					bottom: 10,
					left: 0,
					right: 0,
				} }
			>
				<LinearGradient
					colors={ hueColors }
					style={ {
						borderRadius,
					} }
					start={ { x: 0, y: 0 } }
					end={ { x: 1, y: 0 } }
				>
					<View
						style={ {
							width: barWidth,
							height: barHeight,
						} }
					/>
				</LinearGradient>
				<Animated.View
					pointerEvents="none"
					style={ [
						styles[ 'hue-slider' ],
						{
							width: sliderSize,
							height: sliderSize,
							left: ( sliderSize - borderWidth ) / 2,
							borderRadius: sliderSize / 2,
							transform: [
								{
									translateX: this.sliderX,
								},
							],
						},
					] }
				/>
			</View>
		);
	}
}
