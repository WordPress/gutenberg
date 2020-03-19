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
import { ColorIndicator, BottomSheet } from '@wordpress/components';
import { __experimentalUseGradient } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import styles from './style.scss';

function ColorPicker( {
	shouldEnableBottomSheetScroll,
	isBottomSheetScrolling,
	setBackgroundColor,
	setTextColor,
	backgroundColor,
	textColor,
	onNavigationBack,
	clientId,
	previousScreen,
	onCloseBottomSheet,
} ) {
	const [ hue, setHue ] = useState( 0 );
	const [ sat, setSaturation ] = useState( 0.5 );
	const [ val, setValue ] = useState( 0.5 );
	const [ savedBgColor ] = useState( backgroundColor );
	const [ savedTextColor ] = useState( textColor );
	const { setGradient } = __experimentalUseGradient( {}, clientId );

	const { paddingLeft, height, borderRadius } = styles.picker;
	const pickerWidth = BottomSheet.getWidth() - 2 * paddingLeft;

	const currentColor = tinycolor(
		`hsv ${ hue } ${ sat } ${ val }`
	).toHexString();

	const isGradient = backgroundColor.includes( 'linear-gradient' );
	const isTextScreen = previousScreen === 'Text';

	function setHSVFromHex( color ) {
		const { h, s, v } = tinycolor( color ).toHsv();

		setHue( h );
		setSaturation( s );
		setValue( v );
	}

	useEffect( () => {
		if ( isTextScreen ) {
			setTextColor( currentColor );
		} else {
			setBackgroundColor( currentColor );
		}
	}, [ currentColor ] );

	useEffect( () => {
		if ( isTextScreen ) {
			setHSVFromHex( textColor );
			setTextColor( textColor );
		} else {
			if ( ! isGradient ) {
				setHSVFromHex( backgroundColor );
			}

			setBackgroundColor( backgroundColor );
			setGradient();
		}
		onCloseBottomSheet( resetColors );
	}, [] );

	function onHuePickerChange( { hue: h } ) {
		setHue( h );
	}

	function onSatValPickerChange( { saturation: s, value: v } ) {
		setSaturation( s );
		setValue( v );
	}

	function resetColors() {
		setBackgroundColor( savedBgColor );
		setTextColor( savedTextColor );
	}

	function onPressCancelButton() {
		onNavigationBack();
		onCloseBottomSheet( null );
		resetColors();
	}

	function onPressApplyButton() {
		onNavigationBack();
		onCloseBottomSheet( null );
		if ( isTextScreen ) {
			return setTextColor( currentColor );
		}
		return setBackgroundColor( currentColor );
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
				huePickerBarWidth={ pickerWidth }
				satValPickerSize={ { width: pickerWidth, height } }
				satValPickerBorderRadius={ borderRadius }
				huePickerBorderRadius={ borderRadius }
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
