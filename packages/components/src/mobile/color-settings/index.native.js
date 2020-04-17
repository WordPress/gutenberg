/**
 * External dependencies
 */
import { View, Text, LayoutAnimation } from 'react-native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
import { SETTINGS_DEFAULTS as defaultSettings } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import ColorPicker from '../../color-picker';
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import NavigationHeader from '../bottom-sheet/navigation-header';
import SegmentedControls from '../segmented-control';

import styles from './style.scss';

function ColorSettings( {
	label,
	onColorChange,
	onGradientChange,
	colorValue,
	onReplaceSubsheet,
	shouldEnableBottomSheetScroll,
	shouldSetBottomSheetMaxHeight,
	isBottomSheetScrolling,
	onCloseBottomSheet,
	onHardwareButtonPress,
	getStylesFromColorScheme,
} ) {
	const segments = [ 'Solid', 'Gradient' ];
	const isGradient = colorValue.includes( 'linear-gradient' );
	const selectedSegmentIndex = isGradient ? 1 : 0;

	const [ currentValue, setCurrentValue ] = useState( colorValue );
	const [ isCustomScreen, setIsCustomScreen ] = useState( false );
	const [ activeSegment, setActiveSegment ] = useState(
		segments[ selectedSegmentIndex ]
	);

	const currentSegment = onGradientChange ? activeSegment : segments[ 0 ];
	const isSolidSegment = activeSegment === 'Solid';

	useEffect( () => {
		onHardwareButtonPress( () => {
			if ( isCustomScreen ) {
				setIsCustomScreen( false );
			} else {
				onReplaceSubsheet( 'Settings', {}, afterHardwareButtonPress() );
			}
		} );
	}, [ isCustomScreen ] );

	useEffect( () => {
		setActiveSegment( segments[ selectedSegmentIndex ] );
		shouldSetBottomSheetMaxHeight( true );
		onCloseBottomSheet( null );
	}, [] );

	function afterHardwareButtonPress() {
		onHardwareButtonPress( null );
		shouldSetBottomSheetMaxHeight( true );
	}

	function onCustomScreenToggle( shouldShow ) {
		LayoutAnimation.configureNext(
			LayoutAnimation.create(
				300,
				LayoutAnimation.Types.easeInEaseOut,
				LayoutAnimation.Properties.opacity
			)
		);
		setIsCustomScreen( shouldShow );
	}

	function setColor( color ) {
		setCurrentValue( color );
		if ( isSolidSegment && onColorChange ) {
			onColorChange( color );
		} else if ( ! isSolidSegment && onGradientChange ) {
			onGradientChange( color );
		}
	}

	if ( isCustomScreen ) {
		return (
			<View>
				<ColorPicker
					shouldEnableBottomSheetScroll={
						shouldEnableBottomSheetScroll
					}
					shouldSetBottomSheetMaxHeight={
						shouldSetBottomSheetMaxHeight
					}
					setColor={ setColor }
					activeColor={ currentValue }
					onNavigationBack={ () => {
						onCustomScreenToggle( false );
					} }
					onCloseBottomSheet={ onCloseBottomSheet }
					isBottomSheetScrolling={ isBottomSheetScrolling }
				/>
			</View>
		);
	}

	return (
		<View>
			<NavigationHeader
				screen={ label }
				leftButtonOnPress={ () => onReplaceSubsheet( 'Settings' ) }
			/>
			<ColorPalette
				setColor={ setColor }
				activeColor={ currentValue }
				currentSegment={ currentSegment }
				isCustomScreen={ isCustomScreen }
				onCustomPress={ () => {
					onCustomScreenToggle( true );
				} }
				shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
				defaultSettings={ defaultSettings }
			/>
			<View
				style={ getStylesFromColorScheme(
					styles.horizontalSeparator,
					styles.horizontalSeparatorDark
				) }
			/>
			{ onGradientChange ? (
				<SegmentedControls
					segments={ segments }
					segmentHandler={ ( item ) => setActiveSegment( item ) }
					selectedIndex={ selectedSegmentIndex }
					addonLeft={
						<ColorIndicator
							color={ colorValue }
							style={ styles.colorIndicator }
						/>
					}
				/>
			) : (
				<View style={ styles.footer }>
					<View style={ styles.flex }>
						<ColorIndicator
							color={ currentValue }
							style={ styles.colorIndicator }
						/>
					</View>
					<Text
						style={ styles.selectColorText }
						maxFontSizeMultiplier={ 2 }
					>
						{ __( 'Select a color' ) }
					</Text>
					<View style={ styles.flex } />
				</View>
			) }
		</View>
	);
}

export default withPreferredColorScheme( ColorSettings );
