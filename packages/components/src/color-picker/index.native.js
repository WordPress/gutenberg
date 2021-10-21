/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback, Platform } from 'react-native';
import HsvColorPicker from 'react-native-hsv-color-picker';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BottomSheet } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { Icon, check, close } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.scss';

extend( [ namesPlugin ] );

function ColorPicker( {
	shouldEnableBottomSheetScroll,
	shouldEnableBottomSheetMaxHeight,
	isBottomSheetContentScrolling,
	setColor,
	activeColor,
	isGradientColor,
	onNavigationBack,
	onHandleClosingBottomSheet,
	onBottomSheetClosed,
	onHandleHardwareButtonPress,
	bottomLabelText,
} ) {
	const didMount = useRef( false );
	const isIOS = Platform.OS === 'ios';
	const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };
	const { h: initH, s: initS, v: initV } =
		! isGradientColor && activeColor
			? colord( activeColor ).toHsv()
			: { h: 0, s: 50, v: 50 };
	const [ hue, setHue ] = useState( initH );
	const [ sat, setSaturation ] = useState( initS / 100 );
	const [ val, setValue ] = useState( initV / 100 );
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
	const selectColorTextStyle = usePreferredColorSchemeStyle(
		styles.selectColorText,
		styles.selectColorTextDark
	);
	const footerStyle = usePreferredColorSchemeStyle(
		styles.footer,
		styles.footerDark
	);

	const currentColor = colord( {
		h: hue,
		s: sat * 100,
		v: val * 100,
	} ).toHex();

	useEffect( () => {
		if ( ! didMount.current ) {
			didMount.current = true;
			return;
		}
		setColor( currentColor );
	}, [ currentColor ] );

	useEffect( () => {
		shouldEnableBottomSheetMaxHeight( false );
		onHandleClosingBottomSheet( () => {
			if ( savedColor ) {
				setColor( savedColor );
			}
			if ( onBottomSheetClosed ) {
				onBottomSheetClosed();
			}
		} );
		if ( onHandleHardwareButtonPress ) {
			onHandleHardwareButtonPress( onButtonPress );
		}
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
		onHandleClosingBottomSheet( null );
		shouldEnableBottomSheetMaxHeight( true );
		setColor( action === 'apply' ? currentColor : savedColor );
		if ( onBottomSheetClosed ) {
			onBottomSheetClosed();
		}
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
				{ bottomLabelText ? (
					<Text style={ selectColorTextStyle }>
						{ bottomLabelText }
					</Text>
				) : (
					<Text style={ colorTextStyle } selectable>
						{ currentColor.toUpperCase() }
					</Text>
				) }
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

export { ColorPicker };
