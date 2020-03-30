/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback, Platform } from 'react-native';
import HsvColorPicker from 'react-native-hsv-color-picker';
import tinycolor from 'tinycolor2';
/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BottomSheet } from '@wordpress/components';
import { __experimentalUseGradient } from '@wordpress/block-editor';
import { withPreferredColorScheme } from '@wordpress/compose';
import { Icon, check, close } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.scss';

function ColorPicker( {
	shouldEnableBottomSheetScroll = () => {},
	shouldSetBottomSheetMaxHeight = () => {},
	isBottomSheetScrolling,
	setBackgroundColor,
	setTextColor,
	backgroundColor,
	textColor,
	onNavigationBack,
	clientId,
	previousScreen,
	onCloseBottomSheet = () => {},
	getStylesFromColorScheme,
} ) {
	const isIOS = Platform.OS === 'ios';

	const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };

	const [ hue, setHue ] = useState( 0 );
	const [ sat, setSaturation ] = useState( 0.5 );
	const [ val, setValue ] = useState( 0.5 );
	const [ savedBgColor ] = useState( backgroundColor );
	const [ savedTextColor ] = useState( textColor );
	const { setGradient } = __experimentalUseGradient( {}, clientId );

	const {
		paddingLeft: spacing,
		height: pickerHeight,
		borderRadius,
	} = styles.picker;
	const { height: pickerPointerSize } = styles.pickerPointer;
	const pickerWidth = BottomSheet.getWidth() - 2 * spacing;

	const applyButtonStyle = getStylesFromColorScheme(
		styles.applyButton,
		styles.applyButtonDark
	);
	const cancelButtonStyle = getStylesFromColorScheme(
		styles.cancelButton,
		styles.cancelButtonDark
	);
	const colorTextStyle = getStylesFromColorScheme(
		styles.colorText,
		styles.colorTextDark
	);
	const footerStyle = getStylesFromColorScheme(
		styles.footer,
		styles.footerDark
	);

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
		shouldSetBottomSheetMaxHeight( false );
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
		shouldSetBottomSheetMaxHeight( true );
		resetColors();
	}

	function onPressApplyButton() {
		onNavigationBack();
		onCloseBottomSheet( null );
		shouldSetBottomSheetMaxHeight( true );

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
				huePickerBarHeight={ pickerPointerSize / 2 }
				satValPickerSize={ {
					width: pickerWidth,
					height: pickerHeight,
				} }
				satValPickerSliderSize={ pickerPointerSize * 2 }
				satValPickerBorderRadius={ borderRadius }
				huePickerBorderRadius={ borderRadius }
			/>
			<View style={ footerStyle }>
				<TouchableWithoutFeedback
					onPress={ onPressCancelButton }
					hitSlop={ hitSlop }
				>
					<View>
						{ isIOS ? (
							<Text style={ cancelButtonStyle }>
								{ __( 'Cancel' ) }
							</Text>
						) : (
							<Icon
								icon={ close }
								size={ 24 }
								style={ cancelButtonStyle }
							/>
						) }
					</View>
				</TouchableWithoutFeedback>
				<Text style={ colorTextStyle } selectable>
					{ currentColor.toUpperCase() }
				</Text>
				<TouchableWithoutFeedback
					onPress={ onPressApplyButton }
					hitSlop={ hitSlop }
				>
					<View>
						{ isIOS ? (
							<Text style={ applyButtonStyle }>
								{ __( 'Apply' ) }
							</Text>
						) : (
							<Icon
								icon={ check }
								size={ 24 }
								style={ applyButtonStyle }
							/>
						) }
					</View>
				</TouchableWithoutFeedback>
			</View>
		</>
	);
}

export default withPreferredColorScheme( ColorPicker );
