/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import HsvColorPicker from 'react-native-hsv-color-picker';
import tinycolor from 'tinycolor2';
/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ColorIndicator } from '@wordpress/components';
import { __experimentalUseGradient } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import styles from './style.scss';

function ColorPicker( {
	shouldEnableBottomSheetScroll,
	isBottomSheetScrolling,
	setBackgroundColor,
	backgroundColor,
	onNavigationBack,
	clientId,
} ) {
	const [ hue, setHue ] = useState( 0 );
	const [ sat, setSaturation ] = useState( 0.5 );
	const [ val, setValue ] = useState( 0.5 );
	const [ savedColor ] = useState( backgroundColor );

	const currentColor = tinycolor(
		`hsv ${ hue } ${ sat } ${ val }`
	).toHexString();
	const isGradient = backgroundColor.includes( 'linear-gradient' );
	const { setGradient } = __experimentalUseGradient( {}, clientId );

	useEffect( () => {
		setBackgroundColor( currentColor );
	}, [ currentColor ] );

	useEffect( () => {
		if ( ! isGradient ) {
			const { h, s, v } = tinycolor( backgroundColor ).toHsv();

			setHue( h );
			setSaturation( s );
			setValue( v );
		}

		setBackgroundColor( backgroundColor );
		setGradient();
	}, [] );

	function onHuePickerChange( { hue: h } ) {
		setHue( h );
	}

	function onSatValPickerChange( { saturation: s, value: v } ) {
		setSaturation( s );
		setValue( v );
	}

	function onPressCancelButton() {
		onNavigationBack();
		setBackgroundColor( savedColor );
	}

	function onPressApplyButton() {
		onNavigationBack();
		setBackgroundColor( currentColor );
	}

	return (
		<>
			<HsvColorPicker
				huePickerHue={ hue }
				onHuePickerDragMove={ onHuePickerChange }
				onHuePickerPress={
					! isBottomSheetScrolling && onHuePickerChange
				}
				satValPickerHue={ hue }
				satValPickerSaturation={ sat }
				satValPickerValue={ val }
				onSatValPickerDragMove={ onSatValPickerChange }
				onSatValPickerPress={
					! isBottomSheetScrolling && onSatValPickerChange
				}
				onSatValPickerDragStart={ () => {
					shouldEnableBottomSheetScroll( false );
				} }
				onSatValPickerDragEnd={ () =>
					shouldEnableBottomSheetScroll( true )
				}
				onHuePickerDragStart={ () =>
					shouldEnableBottomSheetScroll( false )
				}
				onHuePickerDragEnd={ () =>
					shouldEnableBottomSheetScroll( true )
				}
			/>
			<View style={ styles.footer }>
				<TouchableWithoutFeedback onPress={ onPressCancelButton }>
					<Text style={ styles.cancelButton }>
						{ __( 'Cancel' ) }
					</Text>
				</TouchableWithoutFeedback>
				<View style={ styles.colorWrapper }>
					<ColorIndicator
						color={ currentColor }
						style={ styles.colorIndicator }
					/>
					<Text style={ styles.colorText }>
						{ currentColor.toUpperCase() }
					</Text>
				</View>
				<TouchableWithoutFeedback onPress={ onPressApplyButton }>
					<Text style={ styles.applyButton }>{ __( 'Apply' ) }</Text>
				</TouchableWithoutFeedback>
			</View>
		</>
	);
}

export default ColorPicker;
