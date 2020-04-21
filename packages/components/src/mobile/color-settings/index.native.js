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
	defaultSettings,
} ) {
	const segments = [ 'Solid', 'Gradient' ];
	const [ currentValue, setCurrentValue ] = useState( colorValue );
	const [ isCustomScreen, setIsCustomScreen ] = useState( false );
	const isGradient = colorValue?.includes( 'linear-gradient' );
	const selectedSegmentIndex = isGradient ? 1 : 0;

	const [ activeSegment, setActiveSegment ] = useState(
		segments[ selectedSegmentIndex ]
	);

	const currentSegment = onGradientChange ? activeSegment : segments[ 0 ];
	const isSolidSegment = activeSegment === 'Solid';

	const horizontalSeparatorStyle = getStylesFromColorScheme(
		styles.horizontalSeparator,
		styles.horizontalSeparatorDark
	);

	useEffect( () => {
		onHardwareButtonPress( () => {
			if ( isCustomScreen ) {
				onCustomScreenToggle( false );
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
		if ( isSolidSegment && onColorChange && onGradientChange ) {
			onColorChange( color );
			onGradientChange( '' );
		} else if ( isSolidSegment && onColorChange ) {
			onColorChange( color );
		} else if ( ! isSolidSegment && onGradientChange ) {
			onGradientChange( color );
		}
	}

	function getFooter() {
		if ( onGradientChange ) {
			return (
				<SegmentedControls
					segments={ segments }
					segmentHandler={ ( item ) => setActiveSegment( item ) }
					selectedIndex={ selectedSegmentIndex }
					addonLeft={
						currentValue && (
							<ColorIndicator
								color={ currentValue }
								style={ styles.colorIndicator }
							/>
						)
					}
				/>
			);
		}
		return (
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
		);
	}

	return (
		<View renderToHardwareTextureAndroid>
			{ isCustomScreen && (
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
			) }
			{ ! isCustomScreen && (
				<View>
					<NavigationHeader
						screen={ label }
						leftButtonOnPress={ () =>
							onReplaceSubsheet( 'Settings' )
						}
					/>
					<ColorPalette
						setColor={ setColor }
						activeColor={ currentValue }
						currentSegment={ currentSegment }
						isCustomScreen={ isCustomScreen }
						onCustomPress={ () => {
							onCustomScreenToggle( true );
						} }
						shouldEnableBottomSheetScroll={
							shouldEnableBottomSheetScroll
						}
						defaultSettings={ defaultSettings }
					/>
					<View style={ horizontalSeparatorStyle } />
					{ getFooter() }
				</View>
			) }
		</View>
	);
}

export default withPreferredColorScheme( ColorSettings );
