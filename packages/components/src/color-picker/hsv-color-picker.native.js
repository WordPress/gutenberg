/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HuePicker from './hue-picker';
import SaturationValuePicker from './saturation-picker';
import styles from './style.native.scss';

const HsvColorPicker = ( props ) => {
	const maxWidth = Dimensions.get( 'window' ).width - 32;
	const satValPickerRef = useRef( null );

	const {
		containerStyle = {},
		currentColor,
		huePickerContainerStyle = {},
		huePickerBorderRadius = 0,
		huePickerHue = 0,
		huePickerBarWidth = maxWidth,
		huePickerBarHeight = 12,
		huePickerSliderSize = 24,
		onHuePickerDragStart,
		onHuePickerDragMove,
		onHuePickerDragEnd,
		onHuePickerDragTerminate,
		onHuePickerPress,
		satValPickerContainerStyle = {},
		satValPickerBorderRadius = 0,
		satValPickerSize = { width: maxWidth, height: 200 },
		satValPickerSliderSize = 24,
		satValPickerHue = 0,
		satValPickerSaturation = 1,
		satValPickerValue = 1,
		onSatValPickerDragStart,
		onSatValPickerDragMove,
		onSatValPickerDragEnd,
		onSatValPickerDragTerminate,
		onSatValPickerPress,
	} = props;

	return (
		<View
			style={ [ styles[ 'hsv-container' ], containerStyle ] }
			testID="hsv-color-picker"
		>
			<SaturationValuePicker
				containerStyle={ satValPickerContainerStyle }
				currentColor={ currentColor }
				borderRadius={ satValPickerBorderRadius }
				size={ satValPickerSize }
				sliderSize={ satValPickerSliderSize }
				hue={ satValPickerHue }
				saturation={ satValPickerSaturation }
				value={ satValPickerValue }
				onDragStart={ onSatValPickerDragStart }
				onDragMove={ onSatValPickerDragMove }
				onDragEnd={ onSatValPickerDragEnd }
				onDragTerminate={ onSatValPickerDragTerminate }
				onPress={ onSatValPickerPress }
				ref={ satValPickerRef }
			/>
			<HuePicker
				containerStyle={ huePickerContainerStyle }
				borderRadius={ huePickerBorderRadius }
				hue={ huePickerHue }
				barWidth={ huePickerBarWidth }
				barHeight={ huePickerBarHeight }
				sliderSize={ huePickerSliderSize }
				onDragStart={ onHuePickerDragStart }
				onDragMove={ onHuePickerDragMove }
				onDragEnd={ onHuePickerDragEnd }
				onDragTerminate={ onHuePickerDragTerminate }
				onPress={ onHuePickerPress }
			/>
		</View>
	);
};

export default HsvColorPicker;
