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
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { Icon, check, close } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.scss';

function ColorPicker( {
	shouldEnableBottomSheetScroll,
	shouldDisableBottomSheetMaxHeight,
	isBottomSheetContentScrolling,
	setColor,
	activeColor,
	isGradientColor,
	onNavigationBack,
	onCloseBottomSheet,
} ) {
	const isIOS = Platform.OS === 'ios';
	const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };

	const [ hue, setHue ] = useState( 0 );
	const [ sat, setSaturation ] = useState( 0.5 );
	const [ val, setValue ] = useState( 0.5 );
	const [ savedColor ] = useState( activeColor );

	const {
		paddingLeft: spacing,
		height: pickerHeight,
		borderRadius,
	} = styles.picker;
	const { height: pickerPointerSize } = styles.pickerPointer;
	const pickerWidth = BottomSheet.getWidth() - 2 * spacing;

	const applyButtonStyle = usePreferredColorSchemeStyle(
		styles.applyButton,
		styles.applyButtonDark
	);
	const cancelButtonStyle = usePreferredColorSchemeStyle(
		styles.cancelButton,
		styles.cancelButtonDark
	);
	const colorTextStyle = usePreferredColorSchemeStyle(
		styles.colorText,
		styles.colorTextDark
	);
	const footerStyle = usePreferredColorSchemeStyle(
		styles.footer,
		styles.footerDark
	);

	const currentColor = tinycolor(
		`hsv ${ hue } ${ sat } ${ val }`
	).toHexString();

	function setHSVFromHex( color ) {
		const { h, s, v } = tinycolor( color ).toHsv();

		setHue( h );
		setSaturation( s );
		setValue( v );
	}

	useEffect( () => {
		setColor( currentColor );
	}, [ currentColor ] );

	useEffect( () => {
		if ( ! isGradientColor && activeColor ) {
			setHSVFromHex( activeColor );
		}
		setColor( activeColor );
		shouldDisableBottomSheetMaxHeight( false );
		onCloseBottomSheet( () => setColor( savedColor ) );
	}, [] );

	function onHuePickerChange( { hue: h } ) {
		setHue( h );
	}

	function onSatValPickerChange( { saturation: s, value: v } ) {
		setSaturation( s );
		setValue( v );
	}

	function onButtonPress( action ) {
		onNavigationBack();
		onCloseBottomSheet( null );
		shouldDisableBottomSheetMaxHeight( true );
		setColor( action === 'apply' ? currentColor : savedColor );
	}

	return (
		<>
			<HsvColorPicker
				huePickerHue={ hue }
				onHuePickerDragMove={ onHuePickerChange }
				onHuePickerPress={
					! isBottomSheetContentScrolling && onHuePickerChange
				}
				satValPickerHue={ hue }
				satValPickerSaturation={ sat }
				satValPickerValue={ val }
				onSatValPickerDragMove={ onSatValPickerChange }
				onSatValPickerPress={
					! isBottomSheetContentScrolling && onSatValPickerChange
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
					onPress={ () => onButtonPress( 'cancel' ) }
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
					onPress={ () => onButtonPress( 'apply' ) }
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

export default ColorPicker;
