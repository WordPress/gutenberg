/**
 * External dependencies
 */
import { Animated, View, PanResponder, StyleSheet } from 'react-native';

/**
 * WordPress dependencies
 */
import React, { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LinearGradient from 'react-native-linear-gradient';
import tinycolor from 'tinycolor2';
import normalizeValue from './utils';

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
			styles.container,
			containerStyle,
			{
				paddingTop,
				paddingBottom: paddingTop,
				paddingLeft,
				paddingRight: paddingLeft,
			},
		];
	}

	getCurrentColor() {
		const { hue = 0 } = this.props;
		return tinycolor( `hue ${ hue } 1.0 0.5` ).toHexString();
	}

	computeHueValueDrag( gestureState ) {
		const { dx } = gestureState;
		const { barWidth = 200 } = this.props;
		const { dragStartValue } = this;
		const diff = dx / barWidth;
		const updatedHue = normalizeValue( dragStartValue / 360 + diff ) * 360;
		return updatedHue;
	}

	computeHueValuePress( event ) {
		const { nativeEvent } = event;
		const { locationX } = nativeEvent;
		const { barWidth = 200 } = this.props;
		const updatedHue = normalizeValue( locationX / barWidth ) * 360;
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
						styles.slider,
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

const styles = StyleSheet.create( {
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	slider: {
		position: 'absolute',
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 7,
		},
		shadowOpacity: 0.43,
		shadowRadius: 10,
		elevation: 5,
	},
} );
