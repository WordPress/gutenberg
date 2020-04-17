/**
 * External dependencies
 */
import { View, Text } from 'react-native';
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
	stack,
	onReplaceSubsheet,
	backgroundColor,
	setBackgroundColor,
	setGradient,
	textColor,
	setTextColor,
	shouldEnableBottomSheetScroll,
	shouldSetBottomSheetMaxHeight,
	isBottomSheetScrolling,
	onCloseBottomSheet,
	onHardwareButtonPress,
	getStylesFromColorScheme,
	defaultSettings,
} ) {
	const segments = [ 'Solid', 'Gradient' ];
	const isGradient = backgroundColor.includes( 'linear-gradient' );
	const selectedSegmentIndex = isGradient ? 1 : 0;

	const [ activeSegment, setActiveSegment ] = useState(
		segments[ selectedSegmentIndex ]
	);

	const currentScreen = stack[ stack.length - 1 ];
	const previousScreen = stack[ stack.length - 2 ];
	const isBackgroundScreen = currentScreen === 'Background';
	const isBackgroundPrevScreen = previousScreen === 'Background';
	const isCustomScreen = currentScreen === 'Custom';

	const currentSegment = isBackgroundScreen ? activeSegment : segments[ 0 ];
	const isSolidSegment = activeSegment === 'Solid';

	const activeColor =
		isBackgroundScreen || isBackgroundPrevScreen
			? backgroundColor
			: textColor;

	useEffect( () => {
		onHardwareButtonPress( () =>
			onReplaceSubsheet( previousScreen, afterHardwareButtonPress() )
		);
	}, [ currentScreen ] );

	useEffect( () => {
		setActiveSegment( segments[ selectedSegmentIndex ] );
		shouldSetBottomSheetMaxHeight( true );
		onCloseBottomSheet( null );
	}, [] );

	const horizontalSeparatorStyle = getStylesFromColorScheme(
		styles.horizontalSeparator,
		styles.horizontalSeparatorDark
	);

	function afterHardwareButtonPress() {
		onHardwareButtonPress( null );
		shouldSetBottomSheetMaxHeight( true );
	}

	function setColor( color ) {
		if ( isBackgroundScreen ) {
			if ( isSolidSegment ) {
				setBackgroundColor( color );
			} else setGradient( color );
		} else if ( isCustomScreen ) {
			if ( isBackgroundPrevScreen ) {
				setBackgroundColor( color );
			} else setTextColor( color );
		} else setTextColor( color );
	}

	function getColorPalette() {
		return (
			<ColorPalette
				setColor={ setColor }
				activeColor={ activeColor }
				currentSegment={ currentSegment }
				currentScreen={ currentScreen }
				onCustomPress={ () => onReplaceSubsheet( 'Custom' ) }
				shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
				defaultSettings={ defaultSettings }
			/>
		);
	}

	function getNavigationHeader( screen ) {
		return (
			<NavigationHeader
				screen={ screen }
				leftButtonOnPress={ () => onReplaceSubsheet( previousScreen ) }
			/>
		);
	}

	return (
		<View>
			{ isBackgroundScreen && (
				<View>
					{ getNavigationHeader( __( 'Background' ) ) }
					{ getColorPalette() }
					<View style={ horizontalSeparatorStyle } />
					<SegmentedControls
						segments={ segments }
						segmentHandler={ ( item ) => setActiveSegment( item ) }
						selectedIndex={ selectedSegmentIndex }
						addonLeft={
							<ColorIndicator
								color={ backgroundColor }
								style={ styles.colorIndicator }
							/>
						}
					/>
				</View>
			) }
			{ currentScreen === 'Text' && (
				<View>
					{ getNavigationHeader( __( 'Text' ) ) }
					{ getColorPalette() }
					<View style={ horizontalSeparatorStyle } />
					<View style={ styles.footer }>
						<View style={ styles.flex }>
							<ColorIndicator
								color={ textColor }
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
				</View>
			) }
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
						activeColor={ activeColor }
						onNavigationBack={ () =>
							onReplaceSubsheet( previousScreen )
						}
						onCloseBottomSheet={ onCloseBottomSheet }
						onReplaceSubsheet={ onReplaceSubsheet }
						isBottomSheetScrolling={ isBottomSheetScrolling }
						previousScreen={ previousScreen }
					/>
				</View>
			) }
		</View>
	);
}

export default withPreferredColorScheme( ColorSettings );
