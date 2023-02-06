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
import { useState, useEffect } from '@wordpress/element';
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
	const isIOS = Platform.OS === 'ios';
	const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };
	const {
		h: initH,
		s: initS,
		v: initV,
	} = ! isGradientColor && activeColor
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

	const combineToHex = ( h = hue, s = sat, v = val ) =>
		colord( { h, s: s * 100, v: v * 100 } ).toHex();

	const currentColor = combineToHex();

	const updateColor = ( { hue: h, saturation: s, value: v } ) => {
		if ( h !== undefined ) setHue( h );
		if ( s !== undefined ) setSaturation( s );
		if ( v !== undefined ) setValue( v );
		setColor( combineToHex( h, s, v ) );
	};

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
		// TODO: Revisit this to discover if there's a good reason for omitting
		// the hook’s dependencies and running it a single time. Ideally there
		// may be a way to refactor and obviate the disabled lint rule. If not,
		// this comment should be replaced by one that explains the reasoning.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

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
				onHuePickerDragMove={ updateColor }
				onHuePickerPress={
					! isBottomSheetContentScrolling && updateColor
				}
				satValPickerHue={ hue }
				satValPickerSaturation={ sat }
				satValPickerValue={ val }
				onSatValPickerDragMove={ updateColor }
				onSatValPickerPress={
					! isBottomSheetContentScrolling && updateColor
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
